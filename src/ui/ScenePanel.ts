import Phaser from 'phaser';

// Native HTML makes forms and buttons accessible inside our Phaser screens.
export function createScenePanel(scene: Phaser.Scene, label: string, className = ''): HTMLElement {
  const canvas = scene.game.canvas;
  canvas.tabIndex = -1;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.removeAttribute('role');

  const panel = document.createElement('section');
  panel.className = `superpath-hvac-game__panel ${className}`;
  panel.setAttribute('aria-label', label);
  canvas.parentElement!.append(panel);

  const removePanel = (): void => {
    panel.remove();
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, removePanel);
    scene.events.off(Phaser.Scenes.Events.DESTROY, removePanel);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, removePanel);
  scene.events.once(Phaser.Scenes.Events.DESTROY, removePanel);
  return panel;
}

export function focusScreen(element: HTMLElement): void {
  requestAnimationFrame(() => {
    if (element.isConnected) element.focus({ preventScroll: true });
  });
}
