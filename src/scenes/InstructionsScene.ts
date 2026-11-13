import Phaser from 'phaser';
import { getCompanyProfile } from '../config/companyProfiles';
import type { RunSetup } from '../state/RunSetup';
import { createScenePanel, focusScreen } from '../ui/ScenePanel';

export class InstructionsScene extends Phaser.Scene {
  private setup!: RunSetup;

  constructor() {
    super('instructions');
  }

  init(data: { setup: RunSetup }): void {
    this.setup = data.setup;
  }

  create(): void {
    const panel = createScenePanel(this, 'How to play');
    panel.innerHTML = `
      <h2 tabindex="-1">How to win your local market</h2>
      <p class="superpath-hvac-game__company-summary"></p>
      <div class="superpath-hvac-game__rules">
        <section><h3>The goal: the most market share</h3>
          <p>Compete against three local HVAC companies over 12 months. Win by completing the largest share of all four companies' jobs across the entire year. Every month counts.</p></section>
        <section><h3>Collect leads, complete jobs</h3>
          <p>Each untimed month starts with 400 Lead Pellets, worth 2 leads each. The month ends when all Lead Pellets have been collected. Your booking rate determines how many leads want to book; your capacity limits how many jobs you can complete.</p></section>
        <section><h3>Invest between months</h3>
          <p>Each completed job earns $400 in revenue. Fifteen percent ($60) goes into your Growth Budget. You start with $3,000, and unspent budget carries forward.</p>
          <p>After Months 1–11, you can invest that budget in booking improvements, visibility, or capacity for the next month. All four companies can invest. There is no investment phase after Month 12.</p></section>
        <section><h3>Get a temporary advertising advantage</h3>
          <p>Four Paid Advertising Pellets are available per month. Collect one to slow the other trucks to half speed for 8 seconds while yours keeps its normal speed. The remaining advertising pellets are disabled until it expires.</p></section>
        <section><h3>Drive your truck</h3>
          <p>Click the game or Tab to focus it. Hold WASD or an arrow key to move; release to stop. Movement is up, down, left, or right. If two directions are held, the last one pressed wins.</p></section>
      </div>
      <p class="superpath-hvac-game__hint">For now, Start Game opens the driving practice area. The maze, AI competitors, and monthly results are coming next.</p>
      <div class="superpath-hvac-game__actions">
        <button type="button" class="superpath-hvac-game__button superpath-hvac-game__button--secondary" data-action="back">Back</button>
        <button type="button" class="superpath-hvac-game__button" data-action="start">Start Game!</button>
      </div>`;
    const profile = getCompanyProfile(this.setup.profileId);
    panel.querySelector('.superpath-hvac-game__company-summary')!.textContent =
      `${this.setup.companyName} · ${profile.name}. Your competitors: ${this.setup.competitorNames.join(', ')}.`;

    const back = panel.querySelector<HTMLButtonElement>('[data-action="back"]')!;
    back.addEventListener('click', () => {
      back.disabled = true;
      this.scene.start('setup', { setup: this.setup });
    });
    const start = panel.querySelector<HTMLButtonElement>('[data-action="start"]')!;
    start.addEventListener('click', () => {
      start.disabled = true;
      this.scene.start('gameplay', { setup: this.setup });
    });
    // Focus the explanation, not the button, after the user presses Next.
    focusScreen(panel.querySelector('h2')!);
  }
}
