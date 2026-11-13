import Phaser from 'phaser';
import { branding } from '../config/branding';
import { getCompanyProfile } from '../config/companyProfiles';
import { driving } from '../config/driving';
import { mazeLayout, mazeOrigin, mazeStarts } from '../config/mazeLayout';
import { pelletRules } from '../config/pellets';
import { DrivingControls } from '../input/DrivingControls';
import { Truck } from '../objects/Truck';
import { PelletLayer } from '../objects/PelletLayer';
import { MazeGrid } from '../world/MazeGrid';
import type { RunSetup } from '../state/RunSetup';
import { PelletRound } from '../state/PelletRound';
import { RunProgress } from '../state/RunProgress';
import { createScenePanel, focusScreen } from '../ui/ScenePanel';

// One scene is restarted for each month; RunProgress survives those restarts.
export class GameplayScene extends Phaser.Scene {
  private truck?: Truck;
  private controls?: DrivingControls;
  private progress!: RunProgress;
  private round!: PelletRound;
  private pellets?: PelletLayer;
  private statusText?: Phaser.GameObjects.Text;
  private campaignRing?: Phaser.GameObjects.Graphics;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private pauseButton?: HTMLButtonElement;
  private paused = false;
  private monthFinished = false;
  private readonly maze = new MazeGrid(mazeLayout, driving.tileSize, mazeOrigin);

  constructor() {
    super('gameplay');
  }

  init(data: { setup?: RunSetup; progress?: RunProgress }): void {
    if (!data.progress && !data.setup) throw new Error('A new game needs company setup.');
    this.progress = data.progress ?? new RunProgress(data.setup!);
    this.round = new PelletRound(this.maze, mazeStarts, this.progress.month);
    this.paused = false;
    this.monthFinished = false;
  }

  create(): void {
    const { width } = this.scale;

    const setup = this.progress.setup;
    const heading = this.add.text(width / 2, 26, setup.companyName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0.5);
    if (heading.width > 864) heading.setFontSize(18);

    this.statusText = this.add.text(width / 2, 62, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    this.drawMaze();
    this.pellets = new PelletLayer(this, this.round);
    const spawn = mazeStarts[(this.progress.month - 1) % mazeStarts.length];
    const start = this.maze.cellCenter(spawn.column, spawn.row);
    this.truck = new Truck(this, start.x, start.y).setDepth(3);
    this.campaignRing = this.add.graphics().setDepth(2);
    const canvas = this.game.canvas;
    canvas.removeAttribute('aria-hidden');
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', `${branding.title}: ${setup.companyName}. Month ${this.progress.month} of 12. Use WASD or arrow keys to drive; Escape pauses.`);
    this.controls = new DrivingControls(canvas);
    focusScreen(canvas);
    const controls = this.controls;
    const releaseControls = (): void => {
      controls.destroy();
      this.pauseButton?.removeEventListener('keydown', this.onPauseKey);
      this.pauseButton?.remove();
      canvas.removeEventListener('keydown', this.onPauseKey);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, releaseControls);
      this.events.off(Phaser.Scenes.Events.DESTROY, releaseControls);
      this.controls = undefined;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, releaseControls);
    this.events.once(Phaser.Scenes.Events.DESTROY, releaseControls);

    this.add.text(60, 620, 'WASD / arrows · Lead dot = 2 leads · Purple PPC = 8 seconds · Esc pauses', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1',
    }).setOrigin(0, 0.5);

    this.pauseButton = document.createElement('button');
    this.pauseButton.type = 'button';
    this.pauseButton.className = 'superpath-hvac-game__pause';
    this.pauseButton.textContent = 'Pause';
    this.pauseButton.addEventListener('click', () => this.setPaused(!this.paused));
    this.pauseButton.addEventListener('keydown', this.onPauseKey);
    canvas.parentElement!.insertAdjacentElement('afterend', this.pauseButton);
    canvas.addEventListener('keydown', this.onPauseKey);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.pauseOverlay = this.add.container(0, 0, [
      this.add.rectangle(width / 2, 320, 560, 100, 0x0f172a, 0.96),
      this.add.text(width / 2, 320, 'Paused · Resume or press Esc to continue', {
        fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#f8fafc',
      }).setOrigin(0.5),
    ]).setDepth(10).setVisible(false);
    this.refreshStatus();
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.monthFinished || !this.truck) return;
    const frameMs = Math.min(delta, driving.maxFrameMs);
    this.round.advance(frameMs);
    // Delta is elapsed milliseconds: movement speed stays consistent across FPS.
    const profile = getCompanyProfile(this.progress.setup.profileId);
    const distance = driving.speed * (1 + profile.speedBonus) * this.round.speedModifier(0) * frameMs / 1000;
    const previous = { x: this.truck.x, y: this.truck.y };
    this.truck.drive(this.controls?.direction ?? null, distance, this.maze);
    const picked = this.round.collectPath(0, previous, { x: this.truck.x, y: this.truck.y }, driving.truckFootprint);
    if (picked.leadIds.length) this.pellets?.refreshLeads();
    this.pellets?.refreshAdvertising();
    this.refreshStatus();
    if (picked.ended) this.finishMonth();
  }

  private refreshStatus(): void {
    const active = this.round.advertisingOwner !== null;
    const warning = active && this.round.advertisingRemainingMs <= pelletRules.advertisingWarningMs;
    const campaign = active ? ` · PPC ${(Math.ceil(this.round.advertisingRemainingMs / 100) / 10).toFixed(1)}s${warning ? ' — expiring' : ''}` : '';
    const collected = this.round.collectedPellets[0] * pelletRules.leadsPerPellet;
    const profile = getCompanyProfile(this.progress.setup.profileId);
    this.statusText?.setText(`Month ${this.progress.month} / 12 · ${profile.name} · Leads ${collected} · Pellets left ${this.round.leads.size}${campaign}`);
    this.statusText?.setColor(warning ? '#fbbf24' : '#cbd5e1');
    this.campaignRing?.clear();
    if (this.truck && this.round.advertisingOwner === 0) {
      const alpha = warning && Math.floor(this.round.advertisingRemainingMs / 200) % 2 === 0 ? 0.25 : 0.9;
      this.campaignRing?.lineStyle(2, warning ? 0xfbbf24 : 0xc084fc, alpha).strokeCircle(this.truck.x, this.truck.y, 17);
    }
    this.truck?.setAlpha(this.round.speedModifier(0) === 0.5 ? 0.6 : 1);
  }

  private setPaused(paused: boolean): void {
    if (this.monthFinished) return;
    this.paused = paused;
    this.controls?.reset();
    this.pauseOverlay?.setVisible(paused);
    if (this.pauseButton) {
      this.pauseButton.textContent = paused ? 'Resume' : 'Pause';
      this.pauseButton.setAttribute('aria-pressed', String(paused));
    }
    if (!paused) focusScreen(this.game.canvas);
  }

  private onPauseKey = (event: KeyboardEvent): void => {
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault();
      this.setPaused(!this.paused);
    }
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) this.setPaused(true);
  };

  private finishMonth(): void {
    this.monthFinished = true;
    this.controls?.reset();
    this.pauseButton?.remove();
    const result = this.round.getResult();
    this.progress.record(result);
    const final = this.progress.isFinished;
    const panel = createScenePanel(this, final ? 'Year complete' : 'Month complete');
    panel.innerHTML = '<h2 tabindex="-1"></h2><p data-month-result></p><p data-year-result></p><p class="superpath-hvac-game__hint">Business results, investments, and competitor standings will be added in the next stages.</p><div class="superpath-hvac-game__actions"><button type="button" class="superpath-hvac-game__button"></button></div>';
    panel.querySelector('h2')!.textContent = final ? 'Year complete!' : `Month ${this.progress.month} complete!`;
    panel.querySelector('[data-month-result]')!.textContent = `You collected ${result.leadPellets[0] * pelletRules.leadsPerPellet} leads this month.`;
    panel.querySelector('[data-year-result]')!.textContent = `Total leads across completed months: ${this.progress.totalLeads(0)}.`;
    const next = panel.querySelector('button')!;
    next.textContent = final ? 'Play Again' : 'Next Month';
    next.addEventListener('click', () => {
      next.disabled = true;
      if (this.progress.advanceMonth()) this.scene.restart({ progress: this.progress });
      else this.scene.start('title', { setup: this.progress.setup, returnFocus: true });
    });
    focusScreen(panel.querySelector('h2')!);
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
