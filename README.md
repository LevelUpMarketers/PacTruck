# PacTruck

A WordPress game plugin. Runtime testing happens in **Local by Flywheel on the laptop**.

## Current step: starting a new game

The game now starts with this flow:

```text
Title → Get Started → Company setup → Next → Instructions → Start Game! → Gameplay
```

The title, setup, instructions, and gameplay are separate Phaser scenes. The first three use native HTML inside the game area for accessible buttons, labels, and form validation. Gameplay uses the canvas and retains the small top-down truck and driving controls.

Company setup requires a company name, accepts an optional email, and lets the player name three competitors and choose a starting profile. Names are limited to 50 characters. Blank competitors use generic defaults, and Balanced is the default profile. Back buttons preserve entered details.

Setup details stay in memory for this game instance; nothing is submitted or stored in the browser. Email is not displayed in instructions or gameplay. Refreshing starts over. Score saving and the leaderboard remain later steps.

The instructions describe the full game's cumulative market-share goal, lead collection, capacity, advertising pellets, and Growth Budget. Investments happen after Months 1–11 and apply to the following month. The current gameplay screen is still a driving practice area; maze walls, other trucks, monthly results/investments, scoring, and the leaderboard come later.

### Try it in Local

1. Pull this session's branch into the plugin repository on your laptop, or pull `main` after merging its pull request.
2. Activate **Superpath HVAC Game** in WordPress.
3. Add `[superpath_hvac_game]` to a page using a Shortcode block, then view the page.
4. Select **Get Started**, enter a company name, optionally complete the other fields, and choose a profile.
5. Select **Next**, read the instructions, then select **Start Game!**. The truck remains unavailable until this step.
6. Hold WASD or an arrow key to drive, then release it to stop. The truck's headlights point in its direction of travel. A yellow outline indicates keyboard focus; click or Tab back to the canvas if focus moves away.

The gameplay heading uses the entered company name and selected profile. The profile's starting speed bonus applies to driving. Booking and capacity stats will feed the business simulation in a later step.

Movement is strictly up, down, left, or right. If you hold two directions, the most recently pressed key wins; releasing it returns to the other held key. Releasing all keys stops immediately. Clicking away or leaving the browser tab also stops the truck. The practice area's outer boundary stops travel, and you can reverse away from it.

Arrow keys keep their normal page behavior when the game is not focused. If a page contains more than one shortcode, only the focused game responds.

The built `dist/` files are committed, so you do not need Node or npm just to try the plugin. It loads its game files locally, without a CDN.

### Follow the code

Read these files in order:

1. **`superpath-hvac-game.php`** — WordPress calls the shortcode function, loads the built script and stylesheet, and creates a container for the game.
2. **`src/main.ts`** — finds that container and starts a Phaser game inside it. This is the browser entry point.
3. **`src/scenes/TitleScene.ts`** — draws the introductory HTML screen. Its Get Started button starts the setup scene.
4. **`src/scenes/SetupScene.ts`** — owns the form, validates entries, and passes setup data to the instructions scene.
5. **`src/scenes/InstructionsScene.ts`** — explains the rules; Start Game starts gameplay with the player's setup data.
6. **`src/scenes/GameplayScene.ts`** — the renamed original driving scene. Its `create()` method draws the practice area and creates the truck; `update()` moves the truck every frame.
7. **`src/objects/Truck.ts`** — owns the top-down drawing, rotation, and movement within the practice area.
8. **`src/input/DrivingControls.ts`** — translates keys into one direction, only while the canvas has focus.

Each scene has its own job and lifetime. `this.scene.start()` ends the current scene and opens the next one. `src/ui/ScenePanel.ts` removes an HTML panel when its scene ends. `src/state/RunSetup.ts` defines the typed data passed between scenes, keeping player details separate from the UI code.

The movement calculation is **speed × elapsed seconds**. That keeps travel speed consistent across different frame rates. A cap on unusually long frames prevents a large jump after a stall.

The placeholder starts with its front facing up. It rotates around its center: 0° for up, 90° for right, 180° for down, and −90° for left. Final artwork can replace the drawing without changing key handling or movement.

Supporting files:

- `src/config/branding.ts` holds the visible title and tagline. Public branding is separate from technical plugin identifiers.
- `src/config/companyProfiles.ts` contains the four starting profiles and their stats.
- `src/config/driving.ts` holds the practice speed, 32-unit grid size, and 28-unit truck footprint. Those are game-world measurements; the canvas scales them to fit the page. The footprint is separate from the artwork so later sprite replacements do not change collision size.
- `src/style.css` makes the canvas fit the page.
- `package.json` lists the exact versions of our tools and the commands to run them. `package-lock.json` pins their dependency tree.
- `vite.config.ts` tells Vite to bundle Phaser and our source into `dist/game.js` and `dist/game.css`.
- `dist/` contains generated files that WordPress loads. Edit `src/`, then rebuild; do not edit the generated files directly.

The path through the system is:

```text
WordPress shortcode → container → main.ts → Phaser → TitleScene
TitleScene → SetupScene → InstructionsScene → GameplayScene
Focused keyboard input → DrivingControls → direction → Truck.drive()
```

**Phaser** handles drawing and frame timing. **TypeScript** checks our code before it runs. **Vite** turns the source and engine into files a browser can load. We use ordinary canvas keyboard events here to keep game controls separate from the rest of the WordPress page.

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
