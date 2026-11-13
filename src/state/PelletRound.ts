import { advertisingCells, pelletRules } from '../config/pellets.js';
import type { MazeGrid, Point } from '../world/MazeGrid';

export type CompanyId = 0 | 1 | 2 | 3;

export interface Pellet {
  readonly id: string;
  readonly column: number;
  readonly row: number;
  readonly x: number;
  readonly y: number;
}

export interface RoundResult {
  readonly month: number;
  readonly leadPellets: readonly [number, number, number, number];
}

export interface PickupResult {
  leadIds: string[];
  advertisingIds: string[];
  ended: boolean;
}

const EPSILON = 0.000001;
const cellKey = (column: number, row: number): string => `${column},${row}`;

// The round owns collectibles and their credit. Rendering never awards points.
export class PelletRound {
  readonly month: number;
  private readonly maze: MazeGrid;
  private readonly leadMap = new Map<string, Pellet>();
  private readonly advertisingMap = new Map<string, Pellet>();
  private readonly credits: [number, number, number, number] = [0, 0, 0, 0];
  private phase: 'playing' | 'complete' = 'playing';
  private advertiser: CompanyId | null = null;
  private remainingAdvertisingMs = 0;

  constructor(
    maze: MazeGrid,
    starts: readonly { column: number; row: number }[],
    month: number,
    seed = (0x50414354 ^ month) >>> 0,
  ) {
    if (!Number.isInteger(month) || month < 1 || month > pelletRules.totalMonths) {
      throw new Error('A pellet round must be a month from 1 through 12.');
    }
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
      throw new Error('The pellet seed must be an unsigned 32-bit integer.');
    }
    if (starts.length !== 4 || advertisingCells.length !== pelletRules.advertisingCount) {
      throw new Error('The round requires four starting positions and four advertising locations.');
    }
    this.maze = maze;
    this.month = month;

    const reserved = new Set<string>();
    for (const cell of starts) {
      this.validateCell(cell);
      const key = cellKey(cell.column, cell.row);
      if (reserved.has(key)) throw new Error('Starting positions must be distinct.');
      reserved.add(key);
    }
    for (const cell of advertisingCells) {
      this.validateCell(cell);
      const key = cellKey(cell.column, cell.row);
      if (reserved.has(key)) throw new Error('Advertising pellets cannot overlap starts or one another.');
      reserved.add(key);
      const pellet = this.makePellet('advertising', cell.column, cell.row);
      this.advertisingMap.set(pellet.id, pellet);
    }

    const candidates: Pellet[] = [];
    for (let row = 0; row < maze.rows; row++) {
      for (let column = 0; column < maze.columns; column++) {
        if (!maze.isWall(column, row) && !reserved.has(cellKey(column, row))) {
          candidates.push(this.makePellet('lead', column, row));
        }
      }
    }
    if (candidates.length < pelletRules.leadCount) {
      throw new Error('The maze needs room for 400 distinct Lead Pellets after reserving starts and advertisements.');
    }

    const random = this.seededRandom(seed);
    for (let index = candidates.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [candidates[index], candidates[other]] = [candidates[other], candidates[index]];
    }
    for (const pellet of candidates.slice(0, pelletRules.leadCount)) {
      this.leadMap.set(pellet.id, pellet);
    }
  }

  get leads(): ReadonlyMap<string, Pellet> { return this.leadMap; }
  get advertisements(): ReadonlyMap<string, Pellet> { return this.advertisingMap; }
  get status(): 'playing' | 'complete' { return this.phase; }
  get advertisingOwner(): CompanyId | null { return this.advertiser; }
  get advertisingRemainingMs(): number { return this.remainingAdvertisingMs; }
  get collectedPellets(): readonly [number, number, number, number] { return [...this.credits]; }

  advance(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new Error('Elapsed time must be finite and nonnegative.');
    if (this.phase === 'complete' || this.advertiser === null) return;

    this.remainingAdvertisingMs = Math.max(0, this.remainingAdvertisingMs - deltaMs);
    if (this.remainingAdvertisingMs === 0) this.advertiser = null;
  }

  speedModifier(companyId: CompanyId): 1 | 0.5 {
    this.validateCompany(companyId);
    return this.advertiser !== null && this.advertiser !== companyId ? 0.5 : 1;
  }

  collectPath(companyId: CompanyId, from: Point, to: Point, footprint: number): PickupResult {
    this.validateCompany(companyId);
    this.validatePath(from, to, footprint);
    const result: PickupResult = { leadIds: [], advertisingIds: [], ended: this.phase === 'complete' };
    if (result.ended) return result;

    // Month completion wins over advertising, even if both are touched this frame.
    for (const pellet of this.leadMap.values()) {
      if (this.hitTime(pellet, from, to, footprint, pelletRules.leadRadius) !== null) {
        this.leadMap.delete(pellet.id);
        this.credits[companyId]++;
        result.leadIds.push(pellet.id);
      }
    }
    if (this.leadMap.size === 0) {
      this.phase = 'complete';
      this.advertisingMap.clear();
      this.advertiser = null;
      this.remainingAdvertisingMs = 0;
      result.ended = true;
      return result;
    }

    // Disabled pellets remain in the maze; touching them does not consume or queue them.
    if (this.advertiser !== null) return result;
    let first: Pellet | null = null;
    let firstTime = Infinity;
    for (const pellet of this.advertisingMap.values()) {
      const time = this.hitTime(pellet, from, to, footprint, pelletRules.advertisingRadius);
      if (time !== null && time < firstTime) {
        first = pellet;
        firstTime = time;
      }
    }
    if (first) {
      this.advertisingMap.delete(first.id);
      this.advertiser = companyId;
      this.remainingAdvertisingMs = pelletRules.advertisingDurationMs;
      result.advertisingIds.push(first.id);
    }
    return result;
  }

  getResult(): RoundResult {
    if (this.phase !== 'complete') throw new Error('The round has not finished.');
    return { month: this.month, leadPellets: [...this.credits] };
  }

  private makePellet(kind: 'lead' | 'advertising', column: number, row: number): Pellet {
    return { id: `${kind}:${cellKey(column, row)}`, column, row, ...this.maze.cellCenter(column, row) };
  }

  private validateCell(cell: { column: number; row: number }): void {
    if (!Number.isInteger(cell.column) || !Number.isInteger(cell.row) || this.maze.isWall(cell.column, cell.row)) {
      throw new Error('Pellet and starting locations must be road cells.');
    }
  }

  private validateCompany(companyId: number): void {
    if (!Number.isInteger(companyId) || companyId < 0 || companyId > 3) throw new Error('Unknown company.');
  }

  private validatePath(from: Point, to: Point, footprint: number): void {
    if (!this.maze.canOccupy(from, footprint) || !this.maze.canOccupy(to, footprint)) {
      throw new Error('Pickup paths must start and end on a road with a valid truck footprint.');
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > EPSILON && Math.abs(dy) > EPSILON) throw new Error('Pickup paths must be cardinal.');
    if (Math.abs(dx) <= EPSILON && Math.abs(dy) <= EPSILON) return;

    const direction = Math.abs(dx) > EPSILON ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const reachable = this.maze.move(from, direction, Math.max(Math.abs(dx), Math.abs(dy)), footprint);
    if (Math.abs(reachable.x - to.x) > EPSILON || Math.abs(reachable.y - to.y) > EPSILON) {
      throw new Error('Pickup paths cannot pass through walls.');
    }
  }

  private hitTime(pellet: Pellet, from: Point, to: Point, footprint: number, radius: number): number | null {
    const half = footprint / 2;
    const left = Math.min(from.x, to.x) - half;
    const right = Math.max(from.x, to.x) + half;
    const top = Math.min(from.y, to.y) - half;
    const bottom = Math.max(from.y, to.y) + half;
    const gapX = Math.max(left - pellet.x, 0, pellet.x - right);
    const gapY = Math.max(top - pellet.y, 0, pellet.y - bottom);
    if (gapX * gapX + gapY * gapY > radius * radius + EPSILON) return null;

    const horizontal = Math.abs(to.x - from.x) > EPSILON;
    const delta = horizontal ? to.x - from.x : to.y - from.y;
    if (Math.abs(delta) <= EPSILON) return 0;
    const perpendicularGap = Math.max(Math.abs((horizontal ? pellet.y - from.y : pellet.x - from.x)) - half, 0);
    const reach = half + Math.sqrt(Math.max(0, radius * radius - perpendicularGap * perpendicularGap));
    const leadingContact = (horizontal ? pellet.x : pellet.y) - Math.sign(delta) * reach;
    return Math.max(0, Math.min(1, (leadingContact - (horizontal ? from.x : from.y)) / delta));
  }

  private seededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
}
