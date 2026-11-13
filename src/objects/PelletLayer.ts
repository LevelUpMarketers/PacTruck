import Phaser from 'phaser';
import { pelletRules } from '../config/pellets';
import type { PelletRound } from '../state/PelletRound';

// Shared lead artwork lets Phaser batch hundreds of pickups efficiently.
export class PelletLayer {
  private readonly leadImages = new Map<string, Phaser.GameObjects.Image>();
  private readonly advertisingDrawing: Phaser.GameObjects.Graphics;
  private advertisingFrame = '';

  constructor(scene: Phaser.Scene, private readonly round: PelletRound) {
    const texture = 'superpath-hvac-lead-pellet';
    if (!scene.textures.exists(texture)) {
      const artwork = scene.add.graphics();
      const size = pelletRules.leadRadius * 2 + 2;
      artwork.fillStyle(0xfbbf24).fillCircle(size / 2, size / 2, pelletRules.leadRadius);
      artwork.generateTexture(texture, size, size);
      artwork.destroy();
    }
    for (const pellet of round.leads.values()) {
      this.leadImages.set(pellet.id, scene.add.image(pellet.x, pellet.y, texture).setDepth(1));
    }
    this.advertisingDrawing = scene.add.graphics().setDepth(1);
    this.refreshAdvertising();
  }

  refreshLeads(): void {
    for (const [id, image] of this.leadImages) {
      if (!this.round.leads.has(id)) {
        image.destroy();
        this.leadImages.delete(id);
      }
    }
  }

  refreshAdvertising(): void {
    const active = this.round.advertisingOwner !== null;
    const warning = active && this.round.advertisingRemainingMs <= pelletRules.advertisingWarningMs;
    const flash = warning && Math.floor(this.round.advertisingRemainingMs / 200) % 2 === 0;
    const frame = `${this.round.advertisements.size}:${active}:${flash}`;
    if (frame === this.advertisingFrame) return;
    this.advertisingFrame = frame;

    const drawing = this.advertisingDrawing.clear();
    for (const pellet of this.round.advertisements.values()) {
      drawing.lineStyle(2, active ? 0x64748b : 0xe9d5ff, flash ? 0.35 : 1);
      drawing.strokeCircle(pellet.x, pellet.y, pelletRules.advertisingRadius + 2);
      drawing.fillStyle(active ? 0x475569 : 0xa855f7, flash ? 0.35 : 1);
      drawing.fillCircle(pellet.x, pellet.y, pelletRules.advertisingRadius);
      if (!active) drawing.fillStyle(0xf5f3ff).fillCircle(pellet.x, pellet.y, 2);
    }
  }
}
