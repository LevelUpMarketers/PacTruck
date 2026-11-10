# PacTruck

A WordPress game plugin. Runtime testing happens in **Local by Flywheel on the laptop**.

## Step 1: a working game canvas

This first step connects WordPress to Phaser. It displays the existing connection message followed by a dark game canvas with the PacTruck title and a blue placeholder truck. Movement, maze rules, scoring, and the leaderboard come in later steps.

### Try it in Local

1. Pull this session's branch into the plugin repository on your laptop, or pull `main` after merging its pull request.
2. Activate **Superpath HVAC Game** in WordPress.
3. Add `[superpath_hvac_game]` to a page using a Shortcode block, then view the page.

The built `dist/` files are committed, so you do not need Node or npm just to try the plugin. It loads its game files locally, without a CDN.

### Follow the code

Read these files in order:

1. **`superpath-hvac-game.php`** — WordPress calls the shortcode function, loads the built script and stylesheet, and creates a container for the game.
2. **`src/main.ts`** — finds that container and starts a Phaser game inside it. This is the browser entry point.
3. **`src/scenes/WelcomeScene.ts`** — our first class. A Phaser scene describes one screen; its `create()` method draws the title and placeholder truck.

Supporting files:

- `src/config/branding.ts` holds the visible title and tagline. Public branding is separate from technical plugin identifiers.
- `src/style.css` makes the canvas fit the page.
- `package.json` lists the exact versions of our tools and the commands to run them. `package-lock.json` pins their dependency tree.
- `vite.config.ts` tells Vite to bundle Phaser and our source into `dist/game.js` and `dist/game.css`.
- `dist/` contains generated files that WordPress loads. Edit `src/`, then rebuild; do not edit the generated files directly.

The path through the system is:

```text
WordPress shortcode → container → bundled main.ts → Phaser → WelcomeScene
```

**Phaser** handles drawing and, later, game input and timing. **TypeScript** checks our code before it runs. **Vite** turns the source and engine into files a browser can load.

## Development commands

Use Node 20.19+ within the Node 20 line, or Node 22.12+ (Node 24 was used for this step). From the repository folder:

```sh
npm ci
npm run build
```

`npm run build` checks TypeScript before producing the WordPress files. Commit rebuilt `dist/` files alongside source changes so they travel together to Local.

For a standalone browser preview with automatic updates:

```sh
npm run dev
```

This uses `index.html` and does not need WordPress. It helps check the game screen, while shortcode integration is checked separately in Local. The development preview is not part of the WordPress runtime.

In the managed cloud environment, use `npm --cache /workspace/.cache/npm ci` if the default npm cache is not writable.

## Dependencies and licenses

This foundation uses Phaser 4.2.1, TypeScript 7.0.2, and Vite 8.3.7. Phaser and its runtime dependency EventEmitter3 are distributed under MIT licenses; their notices are included in `licenses/`.
