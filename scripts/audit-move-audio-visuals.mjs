#!/usr/bin/env node
/**
 * Audita que todos los movimientos de move-metadata tengan:
 * - una ruta de SFX que apunte a un MP3 existente
 * - un tipo de animacion visual resoluble
 *
 * Salida:
 *   public/editor/move-audio-visual-audit.json
 */

import fs from "fs";
import path from "path";
import vm from "vm";
import ts from "typescript";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "public", "editor", "move-audio-visual-audit.json");
const requireFromHere = createRequire(import.meta.url);

const cache = new Map();

function resolveLocalModule(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;

  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function loadTsModule(file) {
  const abs = path.resolve(ROOT, file);
  if (cache.has(abs)) return cache.get(abs).exports;

  const source = fs.readFileSync(abs, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  }).outputText;

  const mod = { exports: {} };
  cache.set(abs, mod);

  const localRequire = (specifier) => {
    const local = resolveLocalModule(abs, specifier);
    if (local) return loadTsModule(path.relative(ROOT, local));
    return requireFromHere(specifier);
  };

  vm.runInNewContext(js, {
    __dirname: path.dirname(abs),
    __filename: abs,
    console,
    exports: mod.exports,
    module: mod,
    process,
    require: localRequire,
  }, { filename: abs });

  return mod.exports;
}

function inc(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function assetCandidates(publicPath) {
  const relative = publicPath.replace(/^\/game\//, "");
  return [
    path.join(ROOT, "game-src", "public", relative),
    path.join(ROOT, "public", "game", relative),
  ];
}

const moveMetadataModule = loadTsModule("game-src/src/app/move-metadata.ts");
const moveSfxModule = loadTsModule("game-src/src/app/move-sfx-map.ts");
const moveAnimationsModule = loadTsModule("game-src/src/app/move-animations.ts");

const moveMetadata = moveMetadataModule.default ?? moveMetadataModule;
const { getMoveSfxInfo } = moveSfxModule;
const { getMoveAnimType } = moveAnimationsModule;

const rows = Object.values(moveMetadata)
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((move) => {
    const sfx = getMoveSfxInfo(move.id);
    const animType = getMoveAnimType(move.id, move.type, move.damageClass);
    const candidates = assetCandidates(sfx.path);

    return {
      id: move.id,
      name: move.name,
      type: move.type,
      damageClass: move.damageClass,
      sfxPath: sfx.path,
      sfxFilename: sfx.filename,
      sfxExact: sfx.exact,
      sfxReason: sfx.reason,
      sfxExistsInSource: fs.existsSync(candidates[0]),
      sfxExistsInBuild: fs.existsSync(candidates[1]),
      animType,
    };
  });

const summary = {
  totalMoves: rows.length,
  exactSfx: rows.filter((row) => row.sfxExact).length,
  fallbackSfx: rows.filter((row) => !row.sfxExact).length,
  missingSfxAssets: rows.filter((row) => !row.sfxExistsInSource && !row.sfxExistsInBuild).length,
  missingRuntimeSfxAssets: rows.filter((row) => !row.sfxExistsInBuild).length,
  missingAnimations: rows.filter((row) => !row.animType).length,
  sfxByReason: {},
  animByType: {},
};

for (const row of rows) {
  inc(summary.sfxByReason, row.sfxReason);
  inc(summary.animByType, row.animType);
}

const audit = {
  generatedAt: new Date().toISOString(),
  summary,
  missingSfxAssets: rows.filter((row) => !row.sfxExistsInSource && !row.sfxExistsInBuild),
  missingRuntimeSfxAssets: rows.filter((row) => !row.sfxExistsInBuild),
  missingAnimations: rows.filter((row) => !row.animType),
  fallbackSfxMoves: rows.filter((row) => !row.sfxExact),
  moves: rows,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(audit, null, 2) + "\n");

console.log(`Audit generado: ${OUT_FILE}`);
console.log(
  `Movimientos: ${summary.totalMoves}; SFX exacto: ${summary.exactSfx}; fallback: ${summary.fallbackSfx}; sin MP3 runtime: ${summary.missingRuntimeSfxAssets}; sin animacion: ${summary.missingAnimations}`
);

if (summary.missingRuntimeSfxAssets > 0 || summary.missingAnimations > 0) {
  process.exitCode = 1;
}
