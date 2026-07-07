import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');

describe('root package.json', () => {
  let raw;
  let pkg;

  before(() => {
    raw = readFileSync(packageJsonPath, 'utf8');
    pkg = JSON.parse(raw);
  });

  test('is valid JSON without a leading BOM', () => {
    assert.equal(raw.charCodeAt(0), '{'.charCodeAt(0));
    assert.doesNotThrow(() => JSON.parse(raw));
  });

  test('retains core package metadata', () => {
    assert.equal(pkg.name, 'money-coach');
    assert.equal(pkg.private, true);
    assert.equal(pkg.packageManager, 'pnpm@11.8.0');
    assert.equal(pkg.type, 'module');
  });

  test('defines exactly the expected set of scripts', () => {
    const expectedScriptNames = [
      'dev',
      'dev:web',
      'dev:api',
      'build',
      'build:web',
      'build:api',
      'lint',
      'lint:web',
      'lint:api',
      'test',
      'test:api',
      'test:api:e2e',
      'typecheck',
      'typecheck:web',
      'typecheck:api',
    ];

    assert.deepEqual(
      Object.keys(pkg.scripts).sort(),
      [...expectedScriptNames].sort(),
    );
  });

  describe('dev scripts', () => {
    test('dev delegates to dev:web', () => {
      assert.equal(pkg.scripts.dev, 'pnpm dev:web');
    });

    test('dev:web filters the web workspace', () => {
      assert.equal(pkg.scripts['dev:web'], 'pnpm --filter web dev');
    });

    test('dev:api filters the api workspace', () => {
      assert.equal(pkg.scripts['dev:api'], 'pnpm --filter api start:dev');
    });
  });

  describe('build scripts', () => {
    test('build runs build:web then build:api', () => {
      assert.equal(pkg.scripts.build, 'pnpm build:web && pnpm build:api');
    });

    test('build:web filters the web workspace', () => {
      assert.equal(pkg.scripts['build:web'], 'pnpm --filter web build');
    });

    test('build:api filters the api workspace', () => {
      assert.equal(pkg.scripts['build:api'], 'pnpm --filter api build');
    });
  });

  describe('lint scripts', () => {
    test('lint runs lint:web then lint:api', () => {
      assert.equal(pkg.scripts.lint, 'pnpm lint:web && pnpm lint:api');
    });

    test('lint:web filters the web workspace', () => {
      assert.equal(pkg.scripts['lint:web'], 'pnpm --filter web lint');
    });

    test('lint:api filters the api workspace', () => {
      assert.equal(pkg.scripts['lint:api'], 'pnpm --filter api lint');
    });
  });

  describe('test scripts', () => {
    test('test delegates to the api e2e suite', () => {
      assert.equal(pkg.scripts.test, 'pnpm test:api:e2e');
    });

    test('test:api filters the api workspace', () => {
      assert.equal(pkg.scripts['test:api'], 'pnpm --filter api test');
    });

    test('test:api:e2e filters the api workspace e2e task', () => {
      assert.equal(
        pkg.scripts['test:api:e2e'],
        'pnpm --filter api test:e2e',
      );
    });
  });

  describe('typecheck scripts', () => {
    test('typecheck runs typecheck:web then typecheck:api', () => {
      assert.equal(
        pkg.scripts.typecheck,
        'pnpm typecheck:web && pnpm typecheck:api',
      );
    });

    test('typecheck:web runs a non-emitting, non-incremental tsc build', () => {
      assert.equal(
        pkg.scripts['typecheck:web'],
        'pnpm --filter web exec tsc -p tsconfig.json --noEmit --incremental false',
      );
    });

    test('typecheck:api runs a non-emitting, non-incremental tsc build', () => {
      assert.equal(
        pkg.scripts['typecheck:api'],
        'pnpm --filter api exec tsc -p tsconfig.json --noEmit --incremental false',
      );
    });

    test('typecheck scripts disable incremental compilation to avoid stale caches', () => {
      for (const name of ['typecheck:web', 'typecheck:api']) {
        assert.match(pkg.scripts[name], /--incremental false/);
      }
    });
  });

  test('every composite script only references scripts declared in this file', () => {
    const compositeScripts = ['build', 'lint', 'typecheck'];
    const scriptNames = new Set(Object.keys(pkg.scripts));

    for (const name of compositeScripts) {
      const referencedScripts = pkg.scripts[name]
        .split('&&')
        .map((part) => part.trim())
        .map((part) => part.replace(/^pnpm\s+/, ''));

      assert.equal(
        referencedScripts.length,
        2,
        `expected "${name}" to chain exactly two scripts`,
      );

      for (const ref of referencedScripts) {
        assert.ok(
          scriptNames.has(ref),
          `expected "${name}" to reference an existing script, got "${ref}"`,
        );
      }
    }
  });

  test('workspace-filtered scripts only target packages that exist in the workspace', () => {
    const filterPattern = /--filter (\S+)/g;
    const referencedWorkspaces = new Set();

    for (const command of Object.values(pkg.scripts)) {
      for (const match of command.matchAll(filterPattern)) {
        referencedWorkspaces.add(match[1]);
      }
    }

    assert.deepEqual([...referencedWorkspaces].sort(), ['api', 'web']);

    const webPkg = JSON.parse(
      readFileSync(path.join(rootDir, 'apps', 'web', 'package.json'), 'utf8'),
    );
    const apiPkg = JSON.parse(
      readFileSync(path.join(rootDir, 'apps', 'api', 'package.json'), 'utf8'),
    );

    assert.equal(webPkg.name, 'web');
    assert.equal(apiPkg.name, 'api');
  });

  test('no script command is empty or whitespace-only', () => {
    for (const [name, command] of Object.entries(pkg.scripts)) {
      assert.equal(
        typeof command,
        'string',
        `expected "${name}" to be a string command`,
      );
      assert.notEqual(
        command.trim(),
        '',
        `expected "${name}" to have a non-empty command`,
      );
    }
  });
});