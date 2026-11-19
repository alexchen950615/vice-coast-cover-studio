// Vice Coast Cover Studio — a gta6-cover-art-01 entry (Node 22, standard library only).
//
// The entry is the static web app in app/ plus the screenshots in screenshots/.
// This program hands both in: it copies them into /output (or MAKEFUN_OUTPUT_DIR
// when run outside the grader) and writes /output/dossier.json with the vendored
// make.fun library, so the sealed scorer can check the entry and the judge can
// read it. It runs twice in the grader and must write identical bytes both times,
// so it does no timestamps, no randomness and no network — plain deterministic copies.
//
// Try the app locally first: `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Gate caps from the competition (reference/gate.json): app/ holds at most 993
// files and 48 MiB, each path at most 1000 bytes; screenshots hold at most 4
// images of at most 256 KiB; the dossier text is capped at 160 KiB. Passing the
// same caps here means a local run refuses exactly what the scorer would refuse.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
console.log(`wrote ${outDir}/dossier.json`);
