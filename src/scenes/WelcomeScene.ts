import Phaser from 'phaser';
import { branding } from '../config/branding';
import { driving } from '../config/driving';
import { DrivingControls } from '../input/DrivingControls';
import { Truck } from '../objects/Truck';
import type { DrivingArea } from '../objects/Truck';

// A scene owns a screen. This one is a small practice area before maze gameplay.
export class WelcomeScene extends Phaser.Scene {
  private truck?: Truck;
  private controls?: DrivingControls;
  private readonly drivingArea: DrivingArea = { left: 48, top: 144, right: 912, bottom: 592 };

  constructor() {
    super('welcome');
  }

  create(): void {
    const { width } = this.scale;

    this.add.text(width / 2, 44, branding.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(width / 2, 88, branding.tagline, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    const area = this.drivingArea;
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e293b);
    for (let x = area.left; x <= area.right; x += driving.tileSize) {
      grid.lineBetween(x, area.top, x, area.bottom);
    }
    for (let y = area.top; y <= area.bottom; y += driving.tileSize) {
      grid.lineBetween(area.left, y, area.right, y);
    }
    grid.lineStyle(2, 0x64748b);
    grid.strokeRect(area.left, area.top, area.right - area.left, area.bottom - area.top);

    this.truck = new Truck(this, width / 2, 352);
    this.controls = new DrivingControls(this.game.canvas);
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
    const distance = driving.speed * Math.min(delta, driving.maxFrameMs) / 1000;
    this.truck?.drive(this.controls?.direction ?? null, distance, this.drivingArea);
  }
}
