import assert from 'node:assert/strict';
import test from 'node:test';
import { MazeGrid } from '../.test-build/world/MazeGrid.js';
import { PelletRound } from '../.test-build/state/PelletRound.js';
import { pelletRules, advertisingCells } from '../.test-build/config/pellets.js';
import { mazeLayout, mazeOrigin, mazeStarts } from '../.test-build/config/mazeLayout.js';
import { driving } from '../.test-build/config/driving.js';

const maze = new MazeGrid(mazeLayout, driving.tileSize, mazeOrigin);
const makeRound = (month = 1, seed = 123) => new PelletRound(maze, mazeStarts, month, seed);
const at = (round, company, pellet) => round.collectPath(company, pellet, pellet, driving.truckFootprint);
const cellKey = pellet => `${pellet.column},${pellet.row}`;

test('a round starts with exactly 400 leads and four nonoverlapping advertisements on roads', () => {
  const round = makeRound();
  assert.equal(round.leads.size, 400);
  assert.equal(round.advertisements.size, 4);
  assert.equal(round.status, 'playing');
  assert.deepEqual(round.collectedPellets, [0, 0, 0, 0]);
  const starts = new Set(mazeStarts.map(cellKey));
  const occupied = new Set();
  for (const pellet of [...round.leads.values(), ...round.advertisements.values()]) {
    assert.equal(maze.isWall(pellet.column, pellet.row), false);
    assert.equal(starts.has(cellKey(pellet)), false);
    assert.equal(occupied.has(cellKey(pellet)), false);
    occupied.add(cellKey(pellet));
  }
  assert.deepEqual([...round.advertisements.values()].map(cellKey), advertisingCells.map(cellKey));
  assert.equal(round.leads.size * pelletRules.leadsPerPellet, 800);
});

test('seeding reproduces a layout and a new round resets the full supply', () => {
  const first = makeRound();
  const repeat = makeRound();
  assert.deepEqual([...first.leads.keys()], [...repeat.leads.keys()]);
  assert.notDeepEqual([...first.leads.keys()], [...makeRound(1, 456).leads.keys()]);
  at(first, 0, first.leads.values().next().value);
  const next = makeRound(2);
  assert.equal(next.month, 2);
  assert.equal(next.leads.size, 400);
  assert.equal(next.advertisements.size, 4);
  assert.deepEqual(next.collectedPellets, [0, 0, 0, 0]);
  assert.equal(next.advertisingOwner, null);
});

test('a Lead Pellet belongs to one collector and is credited only once', () => {
  const round = makeRound();
  const pellet = round.leads.values().next().value;
  assert.deepEqual(at(round, 2, pellet).leadIds, [pellet.id]);
  assert.deepEqual(round.collectedPellets, [0, 0, 1, 0]);
  assert.deepEqual(at(round, 0, pellet).leadIds, []);
  assert.deepEqual(round.collectedPellets, [0, 0, 1, 0]);
  assert.equal(round.leads.size, 399);
});

test('a long cardinal pickup sweep cannot skip leads or credit them twice', () => {
  const round = makeRound();
  const from = maze.cellCenter(1, 1);
  const to = maze.cellCenter(33, 1);
  const expected = [...round.leads.values()].filter(pellet => pellet.row === 1).map(pellet => pellet.id).sort();
  const picked = round.collectPath(1, from, to, driving.truckFootprint);
  assert.ok(expected.length > 20);
  assert.deepEqual(picked.leadIds.sort(), expected);
  assert.equal(round.collectedPellets[1], expected.length);
  assert.equal(round.leads.size, 400 - expected.length);
  assert.deepEqual(round.collectPath(3, from, to, driving.truckFootprint).leadIds, []);
  assert.equal(round.collectedPellets[3], 0);
});

test('one advertising campaign disables other pickups without refreshing or stacking', () => {
  const round = makeRound();
  const [first, second] = [...round.advertisements.values()];
  assert.deepEqual(at(round, 0, first).advertisingIds, [first.id]);
  assert.equal(round.advertisingOwner, 0);
  assert.equal(round.advertisingRemainingMs, 8000);
  assert.equal(round.speedModifier(0), 1);
  assert.equal(round.speedModifier(1), 0.5);
  assert.equal(round.speedModifier(2), 0.5);
  assert.equal(round.speedModifier(3), 0.5);
  round.advance(1000);
  assert.deepEqual(at(round, 1, second).advertisingIds, []);
  assert.deepEqual(at(round, 0, second).advertisingIds, []);
  assert.equal(round.advertisements.size, 3);
  assert.equal(round.advertisingRemainingMs, 7000);
  round.advance(7000);
  assert.equal(round.advertisingOwner, null);
  assert.equal(round.advertisingRemainingMs, 0);
  assert.equal(round.advertisements.size, 3);
  assert.equal(round.speedModifier(1), 1);
  // Expiry alone did not queue a pickup, but standing on the re-enabled pellet can collect it.
  assert.deepEqual(at(round, 1, second).advertisingIds, [second.id]);
  assert.equal(round.advertisingOwner, 1);
  assert.equal(round.advertisingRemainingMs, 8000);
  assert.equal(round.speedModifier(0), 0.5);
  assert.equal(round.speedModifier(1), 1);
});

test('the advertising timer advances only by supplied gameplay time and expires exactly', () => {
  const round = makeRound();
  at(round, 3, round.advertisements.values().next().value);
  round.advance(0);
  assert.equal(round.advertisingRemainingMs, 8000);
  round.advance(5999);
  assert.equal(round.advertisingRemainingMs, 2001);
  round.advance(1);
  assert.equal(round.advertisingRemainingMs, pelletRules.advertisingWarningMs);
  round.advance(1999);
  assert.equal(round.advertisingOwner, 3);
  round.advance(1);
  assert.equal(round.advertisingOwner, null);
  round.advance(50000);
  assert.equal(round.advertisingRemainingMs, 0);
  assert.equal(round.leads.size, 400);
});

test('the final lead ends the month before a simultaneous advertisement and clears leftovers', () => {
  const round = makeRound();
  const ad = round.advertisements.values().next().value;
  const last = [...round.leads.values()].find(pellet =>
    Math.abs(pellet.column - ad.column) + Math.abs(pellet.row - ad.row) === 1);
  assert.ok(last);
  for (const pellet of [...round.leads.values()]) {
    if (pellet.id !== last.id) at(round, 0, pellet);
  }
  assert.equal(round.leads.size, 1);
  assert.equal(round.advertisements.size, 4);
  const picked = round.collectPath(0, last, ad, driving.truckFootprint);
  assert.deepEqual(picked.leadIds, [last.id]);
  assert.deepEqual(picked.advertisingIds, []);
  assert.equal(picked.ended, true);
  assert.equal(round.status, 'complete');
  assert.equal(round.advertisements.size, 0);
  assert.equal(round.advertisingOwner, null);
  assert.equal(round.advertisingRemainingMs, 0);
  assert.deepEqual(round.getResult(), { month: 1, leadPellets: [400, 0, 0, 0] });
  round.advance(9000);
  assert.equal(at(round, 1, ad).ended, true);
  assert.deepEqual(round.collectedPellets, [400, 0, 0, 0]);
});

test('month completion cancels an active campaign as well as uncollected advertisements', () => {
  const round = makeRound();
  at(round, 2, round.advertisements.values().next().value);
  for (const pellet of [...round.leads.values()]) at(round, 1, pellet);
  assert.equal(round.status, 'complete');
  assert.equal(round.advertisingOwner, null);
  assert.equal(round.advertisingRemainingMs, 0);
  assert.equal(round.advertisements.size, 0);
  assert.equal(round.speedModifier(1), 1);
  assert.deepEqual(round.getResult().leadPellets, [0, 400, 0, 0]);
});

test('invalid setup, elapsed time, collectors, and pickup paths are rejected', () => {
  for (const month of [0, 13, 1.5, NaN]) assert.throws(() => makeRound(month));
  for (const seed of [-1, 1.5, Infinity, 0x100000000]) assert.throws(() => makeRound(1, seed));
  assert.throws(() => new PelletRound(maze, mazeStarts.slice(1), 1));
  assert.throws(() => new PelletRound(maze, [mazeStarts[0], ...mazeStarts.slice(0, 3)], 1));
  const round = makeRound();
  assert.throws(() => round.getResult());
  assert.throws(() => round.advance(-1));
  assert.throws(() => round.advance(NaN));
  assert.throws(() => round.speedModifier(4));
  assert.throws(() => round.collectPath(-1, maze.cellCenter(1, 1), maze.cellCenter(1, 1), 21));
  assert.throws(() => round.collectPath(0, maze.cellCenter(1, 1), maze.cellCenter(2, 2), 21));
  assert.throws(() => round.collectPath(0, maze.cellCenter(9, 5), maze.cellCenter(25, 5), 21));
  assert.throws(() => round.collectPath(0, { x: 0, y: 0 }, { x: 0, y: 0 }, 21));
  assert.throws(() => round.collectPath(0, maze.cellCenter(1, 1), maze.cellCenter(1, 1), 0));
});
