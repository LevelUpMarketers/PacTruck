import type { Direction } from '../input/DrivingControls';

export interface Point {
  x: number;
  y: number;
}

const EPSILON = 0.000001;

// Pure geometry: the same tile map drives wall drawing and truck collisions.
export class MazeGrid {
  readonly layout: readonly string[];
  readonly tileSize: number;
  readonly origin: Readonly<Point>;
  readonly columns: number;
  readonly rows: number;

  constructor(layout: readonly string[], tileSize: number, origin: Point) {
    if (!layout.length || !layout[0].length || layout.some(row => row.length !== layout[0].length || /[^#.]/.test(row))) {
      throw new Error('Maze rows must be equally sized and contain only # walls and . roads.');
    }
    if (!Number.isFinite(tileSize) || tileSize <= 0 || !Number.isFinite(origin.x) || !Number.isFinite(origin.y)) {
      throw new Error('Maze dimensions and origin must be finite, with a positive tile size.');
    }
    this.layout = [...layout];
    this.tileSize = tileSize;
    this.origin = { ...origin };
    this.columns = layout[0].length;
    this.rows = layout.length;
  }

  get width(): number { return this.columns * this.tileSize; }
  get height(): number { return this.rows * this.tileSize; }

  isWall(column: number, row: number): boolean {
    return this.layout[row]?.[column] !== '.';
  }

  cellCenter(column: number, row: number): Point {
    return {
      x: this.origin.x + (column + 0.5) * this.tileSize,
      y: this.origin.y + (row + 0.5) * this.tileSize,
    };
  }

  canOccupy(position: Point, footprint: number): boolean {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(footprint) || footprint <= 0) return false;
    const half = footprint / 2;
    const left = this.column(position.x - half + EPSILON);
    const right = this.column(position.x + half - EPSILON);
    const top = this.row(position.y - half + EPSILON);
    const bottom = this.row(position.y + half - EPSILON);
    for (let row = top; row <= bottom; row++) {
      for (let column = left; column <= right; column++) {
        if (this.isWall(column, row)) return false;
      }
    }
    return true;
  }

  move(position: Point, direction: Direction, distance: number, footprint: number): Point {
    if (!Number.isFinite(distance) || distance < 0 || !this.canOccupy(position, footprint)) {
      throw new Error('Truck movement needs a valid road position and a nonnegative finite distance.');
    }

    const half = footprint / 2;
    const horizontal = direction === 'left' || direction === 'right';
    const positive = direction === 'right' || direction === 'down';
    const sign = positive ? 1 : -1;
    const current = horizontal ? position.x : position.y;
    let target = current + sign * distance;
    const axisOrigin = horizontal ? this.origin.x : this.origin.y;
    const index = (value: number): number => Math.floor((value - axisOrigin) / this.tileSize);
    const first = index(current + sign * (half - EPSILON));
    const last = index(target + sign * (half - EPSILON));
    const acrossStart = horizontal ? this.row(position.y - half + EPSILON) : this.column(position.x - half + EPSILON);
    const acrossEnd = horizontal ? this.row(position.y + half - EPSILON) : this.column(position.x + half - EPSILON);

    // Sweep every crossed tile, so even a long frame cannot tunnel through walls.
    for (let cell = first; positive ? cell <= last : cell >= last; cell += sign) {
      let blocked = false;
      for (let across = acrossStart; across <= acrossEnd; across++) {
        if (horizontal ? this.isWall(cell, across) : this.isWall(across, cell)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        const wallEdge = axisOrigin + (cell + (positive ? 0 : 1)) * this.tileSize;
        target = wallEdge - sign * half;
        break;
      }
    }

    return horizontal ? { x: target, y: position.y } : { x: position.x, y: target };
  }

  private column(x: number): number { return Math.floor((x - this.origin.x) / this.tileSize); }
  private row(y: number): number { return Math.floor((y - this.origin.y) / this.tileSize); }
}
