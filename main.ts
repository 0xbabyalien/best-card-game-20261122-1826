// main.ts — Cinder Pact entrypoint (Node 22+, stdlib only).
// Copies game/ and screenshots/ into the output directory and writes
// output/dossier.json via buildDossier from ./vendor/makefun-game.ts.
// Deterministic: entries are copied in sorted order and no timestamps are
// recorded, so two runs write identical bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Copy a tree in sorted order so the output is byte-identical every run.
function copyTreeSorted(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  const entries = readdirSync(srcDir).sort();
  for (const name of entries) {
    const src = join(srcDir, name);
    const dest = join(destDir, name);
    const stat = statSync(src);
    if (stat.isDirectory()) {
      copyTreeSorted(src, dest);
    } else if (stat.isFile()) {
      cpSync(src, dest);
    }
  }
}

function main(): void {
  const gameSrc = join(REPO_ROOT, 'game');
  const shotsSrc = join(REPO_ROOT, 'screenshots');
  if (!existsSync(gameSrc)) throw new Error('game/ is missing from the repository');
  if (!existsSync(shotsSrc)) throw new Error('screenshots/ is missing from the repository');

  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTreeSorted(gameSrc, join(OUTPUT_DIR, 'game'));
  copyTreeSorted(shotsSrc, join(OUTPUT_DIR, 'screenshots'));

  const dossier = buildDossier(OUTPUT_DIR, CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log('wrote ' + join(OUTPUT_DIR, 'dossier.json') + ' (' + dossier.length + ' bytes)');
}

main();
