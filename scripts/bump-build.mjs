#!/usr/bin/env node
/**
 * Bump developer-facing build numbers in app.json (and package.json version when requested).
 * Use before local Xcode/Android archive builds. EAS cloud builds auto-increment via eas.json.
 *
 * Usage:
 *   node scripts/bump-build.mjs           # increment ios.buildNumber + android.versionCode
 *   node scripts/bump-build.mjs --patch   # also bump expo.version patch (1.1.2 -> 1.1.3)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const appJsonPath = resolve(root, 'app.json');
const packageJsonPath = resolve(root, 'package.json');

const bumpPatch = process.argv.includes('--patch');

function bumpSemverPatch(version) {
  const parts = version.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid semver: ${version}`);
  }
  parts[2] += 1;
  return parts.join('.');
}

const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
const { expo } = appJson;

const prevBuildNumber = parseInt(expo.ios?.buildNumber ?? '0', 10);
const prevVersionCode = expo.android?.versionCode ?? 0;
const prevVersion = expo.version;

expo.ios = expo.ios ?? {};
expo.ios.buildNumber = String(prevBuildNumber + 1);
expo.android = expo.android ?? {};
expo.android.versionCode = prevVersionCode + 1;

if (bumpPatch) {
  expo.version = bumpSemverPatch(prevVersion);
}

writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
if (bumpPatch) {
  packageJson.version = expo.version;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

console.log('Version bump complete:');
console.log(`  version:      ${prevVersion}${bumpPatch ? ` -> ${expo.version}` : ''}`);
console.log(`  iOS build:    ${prevBuildNumber} -> ${expo.ios.buildNumber}`);
console.log(`  Android code: ${prevVersionCode} -> ${expo.android.versionCode}`);
