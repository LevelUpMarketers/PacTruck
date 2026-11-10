import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { SetupScene } from './scenes/SetupScene';
import { InstructionsScene } from './scenes/InstructionsScene';
import { GameplayScene } from './scenes/GameplayScene';
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
    // Phaser starts the first scene; the others start only when requested.
    scene: [TitleScene, SetupScene, InstructionsScene, GameplayScene],
    // DrivingControls listens only to the focused canvas, never the whole page.
    input: { keyboard: false, mouse: false, touch: false },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      postBoot: () => {
        container.querySelector('[data-game-status]')?.remove();
      },
    },
  });
}
