import Phaser from 'phaser';
import { branding } from '../config/branding';
import { getCompanyProfile } from '../config/companyProfiles';
import { driving } from '../config/driving';
import { DrivingControls } from '../input/DrivingControls';
import { Truck } from '../objects/Truck';
import type { DrivingArea } from '../objects/Truck';
import type { RunSetup } from '../state/RunSetup';
import { focusScreen } from '../ui/ScenePanel';

// A scene owns a screen. This one is a small practice area before maze gameplay.
export class GameplayScene extends Phaser.Scene {
  private truck?: Truck;
  private controls?: DrivingControls;
  private setup!: RunSetup;
  private readonly drivingArea: DrivingArea = { left: 48, top: 144, right: 912, bottom: 592 };

  constructor() {
    super('gameplay');
  }

  init(data: { setup: RunSetup }): void {
    this.setup = data.setup;
  }

  create(): void {
    const { width } = this.scale;

    const profile = getCompanyProfile(this.setup.profileId);
    const heading = this.add.text(width / 2, 44, this.setup.companyName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0.5);
    if (heading.width > 864) heading.setFontSize(18);

    this.add.text(width / 2, 88, `Month 1 of 12 · ${profile.name}`, {
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
    this.truck?.drive(this.controls?.direction ?? null, distance, this.drivingArea);
  }
}
