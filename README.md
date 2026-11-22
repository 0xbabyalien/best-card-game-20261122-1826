# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/0xbabyalien/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/0xbabyalien/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Cinder Pact** — an original duel card game. You face Rook, a rival who thinks out
loud, across a table of flame, tide, thorn and stone. Life 20 each, 40 cards, one
card revealed at a time — and the same suit twice in a row burns hotter with
Momentum +2.

## The game

- **40 cards, 4 suits × values 1–10.** Suits are told apart by colour *and* shape:
  Flame ▲ red, Tide ● blue, Thorn ◆ green, Stone ■ amber.
- **Simultaneous reveal.** Each round you pick one card and Rook picks secretly;
  both flip at once, then resolve.
- **Momentum.** Play the same suit as your previous round and the card gains +2
  before its effect.
- **Effects.** Flame ▲ attacks (shield absorbs first), Tide ● guards (shield up to
  12), Thorn ◆ leeches half power straight through shield and heals the same,
  Stone ■ quarries half-power shield and draws a card.
- **Win / lose / draw.** Reduce Rook to 0 life to win; both falling in the same
  round is a draw. If the deck empties, hands play out; with both hands empty,
  higher life wins.
- **Rook is readable.** It guards when hurt, leeches through thick shields, chases
  its own momentum — and logs one line of reasoning every round, so you can play
  around it.
- **Screens:** title, table (opponent's face-down hand, played cards centre, your
  hand, life bars, shield pips, round, deck count, action log), win / loss / draw
  screens with stats, and a How to Play screen.
- **Controls:** mouse (click to select, click Play or double-click a card) and
  keyboard (1–7 select, Enter/Space play, N new game, H help, Esc title).
- **Deterministic screenshots:** `?shot=title|play|win|loss` renders fixed seeded
  states for reproducible screenshots.

## Run it

```sh
python3 -m http.server --directory game 8000
# then open http://localhost:8000/ in a desktop browser
```

No build step, no network requests, no external assets — plain HTML, CSS and
JavaScript under `game/`.

## Build the dossier

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22+, stdlib only) copies `game/` and `screenshots/` into the
output directory and writes `dossier.json` via the kit's
`vendor/makefun-game.ts`. Running it twice writes identical bytes.

## Layout

- `game/index.html` — the single page; title, table, end and help screens
- `game/css/style.css` — table, cards, life bars, log
- `game/src/deck.js` — cards, suits, deck, seeded shuffle
- `game/src/ai.js` — Rook's heuristic and its reasoning lines
- `game/src/game.js` — rules and the round state machine
- `game/src/render.js` — DOM rendering (cards, bars, log, end stats)
- `game/src/input.js` — mouse and keyboard input
- `game/src/main.js` — bootstrap and the `?shot=` states
- `screenshots/` — real renders of the game (title, table, win, loss)
- `main.ts` — dossier builder entrypoint
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
