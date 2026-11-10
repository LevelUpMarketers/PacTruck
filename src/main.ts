import Phaser from 'phaser';
import { branding } from './config/branding';
import { WelcomeScene } from './scenes/WelcomeScene';
import './style.css';

// One game per shortcode container; loading the script again won't duplicate it.
for (const container of document.querySelectorAll<HTMLElement>('[data-superpath-hvac-game]')) {
  if (container.dataset.gameMounted === 'true') {
    continue;
  }

  container.dataset.gameMounted = 'true';

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: 960,
    height: 640,
    backgroundColor: '#0f172a',
    banner: false,
    scene: [WelcomeScene],
    // DrivingControls listens only to the focused canvas, never the whole page.
    input: { keyboard: false, mouse: false, touch: false },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      postBoot: (game) => {
        game.canvas.tabIndex = 0;
        game.canvas.setAttribute('role', 'application');
        game.canvas.setAttribute('aria-label', `${branding.title} driving practice. Use WASD or arrow keys to drive.`);
        container.querySelector('[data-game-status]')?.remove();
      },
    },
  });
}
