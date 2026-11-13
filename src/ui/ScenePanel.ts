import Phaser from 'phaser';

// Native HTML makes forms and buttons accessible inside our Phaser screens.
export function createScenePanel(scene: Phaser.Scene, label: string, className = ''): HTMLElement {
  const canvas = scene.game.canvas;
  const container = canvas.parentElement!;
  canvas.tabIndex = -1;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.removeAttribute('role');

  const panel = document.createElement('section');
  panel.className = `superpath-hvac-game__panel ${className}`;
  panel.setAttribute('aria-label', label);
  // Menus use the page width and natural content height; gameplay keeps its canvas size.
  container.classList.add('superpath-hvac-game__canvas--menu');
  container.append(panel);
  scene.scale.refresh();

  const removePanel = (): void => {
    panel.remove();
    container.classList.remove('superpath-hvac-game__canvas--menu');
    scene.scale.refresh();
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
