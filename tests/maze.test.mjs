import assert from 'node:assert/strict';
import test from 'node:test';
import { MazeGrid } from '../.test-build/world/MazeGrid.js';
import { mazeLayout, mazeOrigin, mazeStarts } from '../.test-build/config/mazeLayout.js';
import { driving } from '../.test-build/config/driving.js';

const maze = new MazeGrid(mazeLayout, driving.tileSize, mazeOrigin);
const directions = [
  { name: 'up', x: 0, y: -1 },
  { name: 'right', x: 1, y: 0 },
  { name: 'down', x: 0, y: 1 },
  { name: 'left', x: -1, y: 0 },
];
const equalPosition = (actual, expected) => {
  assert.ok(Math.abs(actual.x - expected.x) < 0.00001, `x: ${actual.x} vs ${expected.x}`);
  assert.ok(Math.abs(actual.y - expected.y) < 0.00001, `y: ${actual.y} vs ${expected.y}`);
};

test('map has a solid boundary and enough room for the planned pellet supply', () => {
  assert.equal(maze.columns, 35);
  assert.equal(maze.rows, 21);
  assert.ok([...mazeLayout[0], ...mazeLayout.at(-1)].every(tile => tile === '#'));
  assert.ok(mazeLayout.every(row => row[0] === '#' && row.at(-1) === '#'));
  const floorCount = mazeLayout.join('').split('').filter(tile => tile === '.').length;
  // No pellets are created yet; reserve room for 400 leads, 4 ads, and 4 starts.
  assert.ok(floorCount >= 408);
  assert.equal(new Set(mazeStarts.map(start => `${start.column},${start.row}`)).size, 4);
});

test('all roads and four future starts are connected, with no one-cell bottlenecks', () => {
  const start = mazeStarts[0];
  const queue = [{ column: start.column, row: start.row }];
  const visited = new Set([`${start.column},${start.row}`]);
  for (let index = 0; index < queue.length; index++) {
    const { column, row } = queue[index];
    for (const direction of directions) {
      const next = { column: column + direction.x, row: row + direction.y };
      const key = `${next.column},${next.row}`;
      if (!maze.isWall(next.column, next.row) && !visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  for (let row = 0; row < maze.rows; row++) {
    for (let column = 0; column < maze.columns; column++) {
      if (maze.isWall(column, row)) continue;
      assert.ok(visited.has(`${column},${row}`));
      assert.ok(directions.filter(d => !maze.isWall(column + d.x, row + d.y)).length >= 2);
      const hasWideRoad = [-1, 1].some(dx => [-1, 1].some(dy =>
        !maze.isWall(column + dx, row) && !maze.isWall(column, row + dy) && !maze.isWall(column + dx, row + dy)));
      assert.ok(hasWideRoad, `Narrow road at ${column},${row}`);
    }
  }
  for (const point of mazeStarts) assert.ok(visited.has(`${point.column},${point.row}`));
});

test('the actual truck footprint can traverse every neighboring road cell', () => {
  for (let row = 0; row < maze.rows; row++) {
    for (let column = 0; column < maze.columns; column++) {
      if (maze.isWall(column, row)) continue;
      const start = maze.cellCenter(column, row);
      assert.ok(maze.canOccupy(start, driving.truckFootprint));
      for (const direction of directions) {
        const end = maze.move(start, direction.name, maze.tileSize, driving.truckFootprint);
        assert.ok(maze.canOccupy(end, driving.truckFootprint));
        if (!maze.isWall(column + direction.x, row + direction.y)) {
          equalPosition(end, maze.cellCenter(column + direction.x, row + direction.y));
        } else {
          assert.ok(Math.hypot(end.x - start.x, end.y - start.y) < 2);
        }
      }
    }
  }
});

const collisionMaze = new MazeGrid([
  '#######',
  '#.....#',
  '#..#..#',
  '#..#..#',
  '#..#..#',
  '#.....#',
  '#######',
], 24, { x: 0, y: 0 });

test('swept collisions stop at every wall face, even with a very large step', () => {
  const footprint = 21;
  const cases = [
    [2, 3, 'right', { x: 61.5, y: 84 }],
    [4, 3, 'left', { x: 106.5, y: 84 }],
    [3, 1, 'down', { x: 84, y: 37.5 }],
    [3, 5, 'up', { x: 84, y: 130.5 }],
    [1, 3, 'left', { x: 34.5, y: 84 }],
  ];
  for (const [column, row, direction, expected] of cases) {
    const result = collisionMaze.move(collisionMaze.cellCenter(column, row), direction, 10000, footprint);
    equalPosition(result, expected);
    assert.ok(collisionMaze.canOccupy(result, footprint));
    equalPosition(collisionMaze.move(result, direction, 5, footprint), expected);
  }
});

test('full footprint blocks corner clipping and permits movement along a touching wall', () => {
  equalPosition(collisionMaze.move({ x: 64, y: 36 }, 'down', 100, 21), { x: 64, y: 37.5 });
  const alongWall = collisionMaze.move({ x: 61.5, y: 36 }, 'down', 96, 21);
  equalPosition(alongWall, { x: 61.5, y: 132 });
  const aroundCorner = collisionMaze.move(alongWall, 'right', 48, 21);
  equalPosition(aroundCorner, { x: 109.5, y: 132 });
  assert.ok(collisionMaze.canOccupy(aroundCorner, 21));
});

test('a truck can reverse and turn immediately after a blocked move', () => {
  const stopped = collisionMaze.move(collisionMaze.cellCenter(2, 3), 'right', 100, 21);
  const reversed = collisionMaze.move(stopped, 'left', 24, 21);
  assert.ok(reversed.x < stopped.x);
  equalPosition(collisionMaze.move(reversed, 'up', 24, 21), { x: reversed.x, y: reversed.y - 24 });
});

test('invalid map data and invalid movement are rejected', () => {
  assert.throws(() => new MazeGrid([], 24, { x: 0, y: 0 }));
  assert.throws(() => new MazeGrid(['##', '#'], 24, { x: 0, y: 0 }));
  assert.throws(() => new MazeGrid(['?'], 24, { x: 0, y: 0 }));
  assert.throws(() => new MazeGrid(['.'], 0, { x: 0, y: 0 }));
  assert.equal(collisionMaze.canOccupy({ x: 0, y: 0 }, 21), false);
  assert.throws(() => collisionMaze.move({ x: 0, y: 0 }, 'right', 1, 21));
  assert.throws(() => collisionMaze.move({ x: 36, y: 36 }, 'right', Infinity, 21));
});
