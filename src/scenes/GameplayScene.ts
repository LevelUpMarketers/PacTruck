import Phaser from 'phaser';
import { branding } from '../config/branding';
import { getCompanyProfile } from '../config/companyProfiles';
import { driving } from '../config/driving';
import { mazeLayout, mazeOrigin, mazeStarts } from '../config/mazeLayout';
import { DrivingControls } from '../input/DrivingControls';
import { Truck } from '../objects/Truck';
import { MazeGrid } from '../world/MazeGrid';
import type { RunSetup } from '../state/RunSetup';
import { focusScreen } from '../ui/ScenePanel';

// The maze is intentionally empty while its routes and handling are reviewed.
export class GameplayScene extends Phaser.Scene {
  private truck?: Truck;
  private controls?: DrivingControls;
  private setup!: RunSetup;
  private readonly maze = new MazeGrid(mazeLayout, driving.tileSize, mazeOrigin);

  constructor() {
    super('gameplay');
  }

  init(data: { setup: RunSetup }): void {
    this.setup = data.setup;
  }

  create(): void {
    const { width } = this.scale;

    const profile = getCompanyProfile(this.setup.profileId);
    const heading = this.add.text(width / 2, 28, this.setup.companyName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0.5);
    if (heading.width > 864) heading.setFontSize(18);

    this.add.text(width / 2, 62, `Month 1 of 12 · ${profile.name}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    this.drawMaze();
    const start = this.maze.cellCenter(mazeStarts[0].column, mazeStarts[0].row);
    this.truck = new Truck(this, start.x, start.y);
    const canvas = this.game.canvas;
    canvas.removeAttribute('aria-hidden');
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', `${branding.title}: ${this.setup.companyName}. Use WASD or arrow keys to drive.`);
    this.controls = new DrivingControls(canvas);
    focusScreen(canvas);
    const controls = this.controls;
    const releaseControls = (): void => {
      controls.destroy();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, releaseControls);
      this.events.off(Phaser.Scenes.Events.DESTROY, releaseControls);
      this.controls = undefined;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, releaseControls);
    this.events.once(Phaser.Scenes.Events.DESTROY, releaseControls);

    this.add.text(width / 2, 620, 'WASD / arrow keys to drive · Release to stop', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    // Delta is elapsed milliseconds: movement speed stays consistent across FPS.
    const profile = getCompanyProfile(this.setup.profileId);
    const distance = driving.speed * (1 + profile.speedBonus) * Math.min(delta, driving.maxFrameMs) / 1000;
    this.truck?.drive(this.controls?.direction ?? null, distance, this.maze);
  }

  private drawMaze(): void {
    const maze = this.maze;
    const size = maze.tileSize;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x080f1b);
    graphics.fillRoundedRect(maze.origin.x, maze.origin.y, maze.width, maze.height, 8);

    graphics.fillStyle(0x172b50);
    for (let row = 0; row < maze.rows; row++) {
      for (let column = 0; column < maze.columns; column++) {
        if (maze.isWall(column, row)) {
          graphics.fillRect(maze.origin.x + column * size, maze.origin.y + row * size, size, size);
        }
      }
    }

    // Outline exposed wall edges only, keeping adjoining wall tiles seamless.
    for (const [width, color, alpha] of [[6, 0x2563eb, 0.2], [2, 0x60a5fa, 1]]) {
      graphics.lineStyle(width, color, alpha);
      graphics.beginPath();
      for (let row = 0; row < maze.rows; row++) {
        for (let column = 0; column < maze.columns; column++) {
          if (!maze.isWall(column, row)) continue;
          const x = maze.origin.x + column * size;
          const y = maze.origin.y + row * size;
          if (row === 0 || !maze.isWall(column, row - 1)) graphics.moveTo(x, y).lineTo(x + size, y);
          if (row === maze.rows - 1 || !maze.isWall(column, row + 1)) graphics.moveTo(x, y + size).lineTo(x + size, y + size);
          if (column === 0 || !maze.isWall(column - 1, row)) graphics.moveTo(x, y).lineTo(x, y + size);
          if (column === maze.columns - 1 || !maze.isWall(column + 1, row)) graphics.moveTo(x + size, y).lineTo(x + size, y + size);
        }
      }
      graphics.strokePath();
    }
  }
}
