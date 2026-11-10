import Phaser from 'phaser';
import { branding } from '../config/branding';

// A scene owns what Phaser draws on one screen. Gameplay comes in a later step.
export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super('welcome');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.28, branding.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.4, branding.tagline, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    // Temporary truck artwork, drawn locally without any image downloads.
    const truck = this.add.graphics({ x: width / 2 - 80, y: height * 0.56 });
    truck.fillStyle(0x38bdf8);
    truck.fillRoundedRect(0, 0, 105, 62, 6);
    truck.fillRoundedRect(105, 18, 55, 44, 5);
    truck.fillStyle(0xe0f2fe);
    truck.fillRect(117, 26, 29, 19);
    truck.fillStyle(0x0f172a);
    truck.fillCircle(32, 66, 14);
    truck.fillCircle(127, 66, 14);
    truck.fillStyle(0x94a3b8);
    truck.fillCircle(32, 66, 6);
    truck.fillCircle(127, 66, 6);
  }
}
