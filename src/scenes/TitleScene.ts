import Phaser from 'phaser';
import { branding } from '../config/branding';
import { createEmptySetup } from '../state/RunSetup';
import type { RunSetup } from '../state/RunSetup';
import { createScenePanel, focusScreen } from '../ui/ScenePanel';

export class TitleScene extends Phaser.Scene {
  private setup: RunSetup = createEmptySetup();
  private returnFocus = false;

  constructor() {
    super('title');
  }

  init(data: { setup?: RunSetup; returnFocus?: boolean } = {}): void {
    this.setup = data.setup ?? createEmptySetup();
    this.returnFocus = data.returnFocus ?? false;
  }

  create(): void {
    const panel = createScenePanel(this, 'Game introduction', 'superpath-hvac-game__title-screen');
    panel.innerHTML = `
      <div class="superpath-hvac-game__hero">
        <p class="superpath-hvac-game__eyebrow">Your company. Your competition. Your market.</p>
        <h2 class="superpath-hvac-game__title"></h2>
        <p class="superpath-hvac-game__tagline"></p>
        <p>Four HVAC companies. Twelve months. Build the business that wins the most market share.</p>
        <button type="button" class="superpath-hvac-game__button">Get Started</button>
      </div>`;
    panel.querySelector('h2')!.textContent = branding.title;
    panel.querySelector('.superpath-hvac-game__tagline')!.textContent = branding.tagline;

    const start = panel.querySelector('button')!;
    start.addEventListener('click', () => {
      start.disabled = true;
      this.scene.start('setup', { setup: this.setup });
    });
    // Initial loading must not steal focus from the surrounding WordPress page.
    if (this.returnFocus) focusScreen(start);
  }
}
