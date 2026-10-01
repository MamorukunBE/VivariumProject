# VivariumProject

A simulation of civilisations, built on a generic simulation engine and displayed with three.js inside an Angular application. `VivariumProject` is a working name, not the official one.

**The repository holds the generic engine only**: entities that move in a straight line, simulated in worker threads over a shared memory and displayed as plain discs. There is no game rule yet. The engine was ported from a separate proof of concept, `Entities_POC` (https://github.com/MamorukunBE/Entities_POC). Anything added here must follow the architecture below, even when a shortcut would be simpler.

## How to work

- **Always converse with the user in French.** Code, comments and this file are in English.
- Go step by step: one decision at a time, without projecting beyond what has been settled. Business rules (arbitration, combining states, etc.) are deliberately postponed; only the architecture that will host them is being laid down.
- A decision is settled only when the user says so. Do not reopen a settled decision unless the user asks.
- Keep it as simple as possible. No options, no abstraction built for a future need.
- Never reason in "game of life" terms: there is no grid of cells, positions are continuous. In French, never say "case"; say "emplacement mémoire" (memory slot) for the place of an entity in the typed arrays.

## Commands

- `npm start`: dev server on http://localhost:4200. The simulation starts as soon as the page opens. Restart it after changing `angular.json` or a `tsconfig`: it does not reload them.
- `npx ng build`: production build, run it to check that everything compiles.
- `npm test -- --no-watch`: unit tests (Vitest, through the Angular test builder) with the coverage report. The run fails below 100% coverage.
- `npx prettier --write "src/**/*.{ts,css,html}"`: formatting.

Angular 21 is used because Angular 22 requires Node 24.15 or later.

## Code conventions

- Indentation: **three spaces**, never two, never tabs. Configured in `.prettierrc` and `.editorconfig`. Prettier does not format GLSL inside template strings: indent it by hand with three spaces too.
- Code, identifiers and comments are in English.
- Comments are always written with `//`, even when they span several lines. No `/* ... */` block comments, except in CSS files, where it is the only syntax.
- The one exception is JSDoc (`/** ... */`), which is **mandatory** on everything public: every file (`/** @file ... */` on the first line), every exported class, interface, function and constant, and every public method, constructor and field. Private members and comments inside a body use `//`.
- JSDoc must be complete enough to be useful in IntelliSense: a description of what the thing does, a `@param name - description` line for every parameter, a `@returns` line whenever something is returned, and the units of every number (world units, seconds, pixels...). Add `@example` on classes when the usage is not obvious. Do not repeat TypeScript types in the JSDoc.

   ```ts
   /**
    * Overwrites the position of an entity.
    *
    * @param id - Id of the entity.
    * @param x - New x coordinate, in world units.
    * @param y - New y coordinate, in world units.
    */
   setPosition(id: number, x: number, y: number): void {
   ```
- Every tunable value lives in `src/app/constants.ts`. No hardcoded value anywhere else.
- **A file or a class is named after what it is, never after a metaphor.** `impact-queue.ts` holds a queue of impacts; a name such as `letter-box` says nothing to someone who opens the folder. A name must also not mix two ideas: name the thing by its nature, not by what it happens to carry today.
- **A file goes where its purpose puts it**, not next to whoever uses it: what configures goes in `configurers/`, what helps data flow between components goes in `flow-helpers/`.
- **Hot loops work directly on the shared memory.** Take the typed views from the Accessor once, before the loop, then index them. No function call per entity, and no JavaScript object created per entity or per tick.
- TypeScript only. No WASM for now.
- Only `src/app/renderer` knows three.js. The simulation folders (`accessor`, `channels`, `processors`, `dispatcher`, `orchestrator`, `displayer`, `configurers`, `flow-helpers`) do not depend on three.js, and they run in worker threads: no DOM, no Angular, apart from the two injection tokens (`orchestrator/simulation-starter.ts`, `renderer/renderer-factory.ts`).

### Single-statement scopes

A control-flow scope (`if`, `else`, `for`, `while`) that holds a single statement is written without braces, on the same line as its opening:

```ts
// Yes
if (approach <= 0) return;
for (let i = 0; i < count; i++) this.entities.setColorAt(i, color);

// No
if (approach <= 0) {
   return;
}
```

The same goes for functions and methods: one holding a single statement is written as a braceless arrow function, on one line.

```ts
// Yes
readonly getX = (id: number): number => this.px[id];

// No
getX(id: number): number {
   return this.px[id];
}
```

If the line would exceed the print width, shorten it (a local variable usually does it) rather than keeping the braces. Braces stay only where the language leaves no choice: when the single statement is itself a multi-line block (a nested loop), when a function body is a statement that is not an expression (a lone `while`), and in constructors.

### Sections

Code may be split into sections in exactly two ways. **A blank line that is not followed by a comment is never acceptable, anywhere**: inside function bodies, between class members, between imports and declarations, inside GLSL strings. Either two blocks are distinct sections, or they are the same section.

1. **A blank line followed by a comment** describing the section that follows:

   ```ts
   const limit = worldHalfSize - radius;

   // Bounce off the world edges.
   if (Math.abs(x) > limit) {
      x = Math.sign(x) * limit;
   }
   ```

2. **A `//-----` line, with no blank line and no comment**, when two sections follow each other but fundamentally work for the same logical unit:

   ```ts
   const ax = accessor.getX(a);
   const ay = accessor.getY(a);
   //-----
   channel.forEachNear(ax, ay, visit);
   ```

A doc comment (`/** ... */`) counts as the comment that opens a section.

## Tests

- **Every feature ships with unit tests covering 100% of its code**: statements, branches, functions and lines. The threshold is enforced in `vitest.config.ts`. Left out of the measure: `src/main.ts`, the `_tests` folders, and the files that can only run in a real browser thread, which must stay a few lines long (`*.worker.ts`, `**/worker-factory.ts`).
- The tests of a folder always live in a `_tests` subfolder of that folder: `channels/channel.ts` is tested by `channels/_tests/channel.spec.ts`. Test doubles live there too (`renderer/_tests/three.fake.ts`).
- Tests follow the same code conventions as the rest. Inside a `describe`, tests are separated by a `//-----` line. Inside a test, the setup and the action are separated by `//-----`, and the checks come after a blank line and a comment saying what is being checked.
- Tests run in jsdom, where there is neither WebGL nor Worker: anything that needs them must be injectable. The Renderer receives its `THREE.WebGLRenderer`; the application gets its Renderer and its worker threads through the `RENDERER_FACTORY` and `SIMULATION_STARTER` injection tokens, which tests override. `SharedArrayBuffer` and `Atomics` do work in tests; what another thread would do is simulated by mocking `Atomics.wait`.
- Unit tests cannot prove that the threads work together. After a change to the workers, the dispatcher or the memory layout, also run the application in a real browser and check the debugging overlay and the console.
- Assert on behaviour through the public API. Reach for private members only when there is no other way to observe the result (three.js objects held by the Renderer, for instance).

## Vocabulary

- **Entity**: a simulation unit. It has a single state, the current one; the new state overwrites the old one.
- **Channel** (canal): a shared information tool. It splits space into cells and lists the entities present in each. It is used to find nearby entities.
- **Sub-channel** (sous-canal): sits on top of a channel and gives one value per cell (an area of influence). It is recomputed right after its channel.
- **Link** (lien): an explicit relation between two entities, carrying three pieces of information: what, who, for whom. Created and broken by actions, independent of positions.
- **Tick**: one simulation step, run by `orchestrate()`.
- User's convention: the screen is "at the top", the core is "at the bottom".


## Architecture

### Threads and memory

- **All the data lives in one `SharedArrayBuffer`**: positions, velocities, entity locks, the proximity channel, and the counters the threads use to coordinate. Its layout is defined in one place, `accessor/accessor.ts`.
- **The Accessor is the single access point to that memory.** It is not a service that threads send messages to: every thread builds its own Accessor over the same buffer and gets typed views on the same bytes, with no copy.
- **The main thread only displays.** It allocates the memory, sets the initial state, starts the workers, then reads the memory on every frame. It never runs a tick, never takes a lock and never sleeps.
- **One worker runs the Orchestrator**, on a timer. **One worker per lot** runs the Processors for a contiguous range of entities. Below `SINGLE_THREAD_THRESHOLD` entities, or on a machine with no core to spare, there is a single lot and no lot worker: the Orchestrator worker runs every step itself, with the same Processors.
- `SharedArrayBuffer` requires the page to be cross-origin isolated: the `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers, already set for the dev server in `angular.json`. A production server must send them too.

### Folders

`src/app` has one folder per component of the architecture, named after it. There is no generic `engine`, `core` or `utils` folder: a new component of the plan gets its own folder. Angular services go under `services/`, one subfolder each. Every folder has its `_tests` subfolder. `flow-helpers/` is still empty and holds a `.gitkeep` file, to be removed when its first real file arrives.

```
src/app/
├── accessor/          shared memory layout, Accessor, entity locks
├── channels/          proximity channel (later: sub-channels)
├── processors/        the rules, one file per Processor
├── dispatcher/        CalculusDispatcher, lots, lot worker, step runner
├── orchestrator/      Orchestrator, its worker, start and stop of the workers
├── displayer/         Displayer and ViewModel
├── renderer/          Renderer: the only folder that knows three.js
├── configurers/       what sets the simulation up: the initial state
├── flow-helpers/      what carries data between components (empty for now)
├── services/
│   └── debugger/      DebuggerService
├── constants.ts
├── app.ts
└── app.config.ts
```

### Components

| Component | Role | File |
|---|---|---|
| Accessor | Typed views over the shared memory; the single access point to it | `accessor/accessor.ts` |
| Entity locks | One lock per entity, taken in increasing id order. Not used by any rule yet | `accessor/entity-lock.ts` |
| Channel | Proximity channel, stored in the shared memory, rebuilt every tick | `channels/channel.ts` |
| Processors | The rules. Only the movement exists for now: entities go on in a straight line, nothing keeps them inside the world | `processors/*.processor.ts` |
| CalculusDispatcher | Has a step run for every lot and waits for all of them: the barrier between steps | `dispatcher/calculus-dispatcher.ts` |
| Step runner | Maps a step and a lot to the Processor call | `dispatcher/step-runner.ts` |
| Orchestrator | Runs the steps of a tick in order | `orchestrator/orchestrator.ts` |
| Simulation starter | Starts and stops the worker threads from the main thread | `orchestrator/simulation-starter.ts` |
| Initial state | Gives every entity a random position and velocity; a placeholder until civilisations spawn | `configurers/initial-state.configurer.ts` |
| Displayer | Copies the memory into the ViewModel, at the display's own pace | `displayer/displayer.ts` |
| Renderer | Displays the ViewModel with three.js | `renderer/renderer.ts` |
| DebuggerService | Angular service that displays the frame rate, the tick duration and the graphics card over the canvas | `services/debugger/debugger.service.ts` |

### The tick

Four steps, in this order. A step never overlaps the next one: the dispatcher returns only when every lot has finished. All four are dispatched on every tick. **The decision and action steps have no rule yet**: they do nothing until their first Processors are written and plugged into the step runner.

| Step | Concurrency |
|---|---|
| 1. Movement | Each lot writes its own entities only: no lock |
| 2. Channels | Each lot prepares its own entities, the lists are built by a single thread: no lock |
| 3. Decision | Entities are only read; each lot writes its own buffer: no lock |
| 4. Action | **The only step that takes locks**: the entities involved are locked, lowest id first, the situation is checked again, then the action is applied |

- Within a tick, a waiting thread first waits actively (`SPIN_ITERATIONS` checks), then sleeps on `Atomics.wait`. Between two ticks, the lot workers are asleep.
- If a tick takes longer than planned, there is no catch-up: the simulation simply slows down on screen.
- First come, first served in the Action step: the simulation cannot be replayed identically, and that is accepted.

### Display

- The simulation does not depend on the display: the Displayer comes and reads.
- A tick counter in the shared memory is odd while a tick is running. The Displayer copies what it needs, then checks that the counter is even and unchanged; otherwise it copies again, up to `DISPLAY_READ_ATTEMPTS` times.
- The frame rate is bounded by the refresh rate of the screen. The tick duration is what measures the speed of the simulation.

### Settled but not implemented yet

- The rules of the decision and action steps. The POC shows how they work: contacts recorded per lot, then applied under locks.
- An event queue from the simulation to the display, as the impact queue of the POC.
- Links between entities (what, who, for whom), indexed at both ends.
- Sub-channels.
- Named cumulative layers of entity data (position, movement, intrinsic state, extrinsic state).
- Creation and death of entities: an entity that dies is removed immediately, and its memory slot can only be reused from the next tick.
- Long actions broken down into atomic ones, through an intermediate entity if needed (shoot, the bullet moves, the bullet hits).
- Variable-size data as linked lists with memory offsets.
- Read/write locks. The current locks are exclusive.
- Saving and reloading the memory through the Accessor.

## Game model

First part of the game: civilisations. This is a starting base, expected to change a lot.

- A civilisation is defined by its **race**.
- Every race shares the same **attributes**. The list is open: more will be added.
- An attribute of a race is `{ attributeId, min, max, value }`. `value` is the value of the race; `min` and `max` are the limits of that race for that attribute, as in AD&D.
- The scale goes from 1 to 20. **10 is the average**, and the human is the reference: 10 everywhere. A race raises or lowers each attribute around that average.
- The totals do not have to be equal: a giant is a human that is better at everything. Totals are multiples of 5, and the ratio to the weakest total gives an indicative difficulty of the race.
- Until the game foundations exist, the chosen civilisation is a global variable in a `playGlobals.ts` file, meant to disappear. Attributes and races live in a project file for now, in a database later.
- How these values act in the game is not decided yet.

| Family | Attribute | Id | Measures |
|---|---|---|---|
| Body | Force | `strength` | Physical power |
| | Endurance | `endurance` | Resistance to effort and blows |
| | Vitesse | `speed` | Speed of movement |
| | Agilité | `agility` | Precision and dodging |
| | Immunité | `immunity` | Resistance to disease and poison |
| Life cycle | Longévité | `longevity` | Life span |
| | Fécondité | `fertility` | Renewal of the population |
| | Frugalité | `frugality` | How little is needed to survive |
| Mind | Perception | `perception` | Range of the senses |
| | Ingéniosité | `ingenuity` | Learning, inventing, crafting |
| | Magie | `magic` | Affinity with magic |
| | Charisme | `charisma` | Attracting and influencing others |
| | Sociabilité | `sociability` | Tendency to join an established group |

Starting values:

| | Human | Orc | Dwarf | Gnome | Elf | Giant | Goblin | Troll |
|---|---|---|---|---|---|---|---|---|
| strength | 10 | 14 | 13 | 6 | 8 | 19 | 6 | 18 |
| endurance | 10 | 14 | 14 | 7 | 8 | 18 | 7 | 17 |
| speed | 10 | 10 | 7 | 9 | 12 | 12 | 12 | 8 |
| agility | 10 | 9 | 8 | 12 | 14 | 11 | 13 | 6 |
| immunity | 10 | 13 | 13 | 9 | 11 | 14 | 9 | 18 |
| longevity | 10 | 8 | 13 | 13 | 18 | 15 | 5 | 12 |
| fertility | 10 | 12 | 7 | 9 | 5 | 10 | 16 | 6 |
| frugality | 10 | 9 | 10 | 14 | 12 | 10 | 13 | 5 |
| perception | 10 | 10 | 8 | 11 | 14 | 12 | 10 | 7 |
| ingenuity | 10 | 7 | 14 | 15 | 12 | 11 | 8 | 4 |
| magic | 10 | 8 | 8 | 14 | 15 | 11 | 7 | 6 |
| charisma | 10 | 9 | 9 | 8 | 13 | 12 | 5 | 4 |
| sociability | 10 | 7 | 11 | 8 | 8 | 10 | 14 | 4 |
| **Total** | 130 | 130 | 135 | 135 | 150 | 165 | 125 | 115 |
