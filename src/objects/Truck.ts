import Phaser from 'phaser';
import { driving } from '../config/driving';
import type { Direction } from '../input/DrivingControls';
import type { MazeGrid } from '../world/MazeGrid';

const movement = {
  up: { x: 0, y: -1, angle: 0 },
  right: { x: 1, y: 0, angle: 90 },
  down: { x: 0, y: 1, angle: 180 },
  left: { x: -1, y: 0, angle: -90 },
};

export class Truck extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setSize(driving.truckFootprint, driving.truckFootprint);

    // A small roof-view placeholder. Its front points UP before rotation.
    const art = scene.add.graphics();
    art.fillStyle(0x020617);
    art.fillRect(-13, -9, 4, 7);
    art.fillRect(9, -9, 4, 7);
    art.fillRect(-13, 6, 4, 7);
    art.fillRect(9, 6, 4, 7);
    art.fillStyle(0x38bdf8);
    art.fillRoundedRect(-10, -14, 20, 28, 3);
    art.fillStyle(0x0ea5e9);
    art.fillRect(-7, 0, 14, 11);
    art.fillStyle(0xe0f2fe);
    art.fillRect(-7, -9, 14, 6);
    art.fillStyle(0xfde68a);
    art.fillRect(-8, -14, 4, 2);
    art.fillRect(4, -14, 4, 2);
    art.fillStyle(0xef4444);
    art.fillRect(-8, 12, 3, 2);
    art.fillRect(5, 12, 3, 2);
    // Keep the authored roof-view art proportional to the collision footprint.
    art.setScale(driving.truckFootprint / 28);
    this.add(art);
  }

  drive(direction: Direction | null, distance: number, maze: MazeGrid): void {
    if (!direction) return;

    const step = movement[direction];
    this.setAngle(step.angle);

    const next = maze.move({ x: this.x, y: this.y }, direction, distance, driving.truckFootprint);
    this.setPosition(next.x, next.y);
  }
}
