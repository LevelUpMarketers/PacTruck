export type Direction = 'up' | 'right' | 'down' | 'left';

const bindings: Readonly<Record<string, Direction>> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
};

// Listen to this canvas, not the whole page or another shortcode's game.
export class DrivingControls {
  private heldKeys: string[] = [];

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.addEventListener('keydown', this.onKeyDown);
    canvas.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('blur', this.clear);
    window.addEventListener('blur', this.clear);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  get direction(): Direction | null {
    const latestKey = this.heldKeys[this.heldKeys.length - 1];
    return latestKey ? bindings[latestKey] : null;
  }

  destroy(): void {
    this.clear();
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('blur', this.clear);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!bindings[event.code]) return;

    event.preventDefault();
    // Auto-repeat must not promote an older held key to the newest direction.
    if (!event.repeat && !this.heldKeys.includes(event.code)) {
      this.heldKeys.push(event.code);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (!bindings[event.code]) return;

    event.preventDefault();
    this.heldKeys = this.heldKeys.filter(code => code !== event.code);
  };

  private onPointerDown = (): void => {
    this.canvas.focus({ preventScroll: true });
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) this.clear();
  };

  private clear = (): void => {
    this.heldKeys = [];
  };
}
