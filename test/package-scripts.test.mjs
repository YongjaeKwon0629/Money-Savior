import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const rootPackageJsonPath = path.join(rootDir, 'package.json');
const rootPackageJsonRaw = readFileSync(rootPackageJsonPath, 'utf8');
const rootPackageJson = JSON.parse(rootPackageJsonRaw);

const apiPackageJson = JSON.parse(
  readFileSync(path.join(rootDir, 'apps/api/package.json'), 'utf8'),
);
const webPackageJson = JSON.parse(
  readFileSync(path.join(rootDir, 'apps/web/package.json'), 'utf8'),
);

describe('root package.json', () => {
  test('is valid JSON without a leading BOM character', () => {
    // The diff for this PR removes a stray UTF-8 BOM (\uFEFF) that
    // previously preceded the opening brace of the file.
    assert.equal(rootPackageJsonRaw.charCodeAt(0), '{'.charCodeAt(0));
    assert.ok(!rootPackageJsonRaw.startsWith('\uFEFF'));
  });

  test('preserves top level metadata', () => {
    assert.equal(rootPackageJson.name, 'money-coach');
    assert.equal(rootPackageJson.private, true);
    assert.equal(rootPackageJson.packageManager, 'pnpm@11.8.0');
    assert.equal(rootPackageJson.type, 'module');
  });

  test('defines a scripts object', () => {
    assert.equal(typeof rootPackageJson.scripts, 'object');
    assert.notEqual(rootPackageJson.scripts, null);
  });
});

describe('root package.json scripts - exact commands', () => {
  const expectedScripts = {
    dev: 'pnpm dev:web',
    'dev:web': 'pnpm --filter web dev',
    'dev:api': 'pnpm --filter api start:dev',
    build: 'pnpm build:web && pnpm build:api',
    'build:web': 'pnpm --filter web build',
    'build:api': 'pnpm --filter api build',
    lint: 'pnpm lint:web && pnpm lint:api',
    'lint:web': 'pnpm --filter web lint',
    'lint:api': 'pnpm --filter api lint',
    test: 'pnpm test:api:e2e',
    'test:api': 'pnpm --filter api test',
    'test:api:e2e': 'pnpm --filter api test:e2e',
    typecheck: 'pnpm typecheck:web && pnpm typecheck:api',
    'typecheck:web': 'pnpm --filter web exec tsc -p tsconfig.json --noEmit --incremental false',
    'typecheck:api': 'pnpm --filter api exec tsc -p tsconfig.json --noEmit --incremental false',
  };

  for (const [name, command] of Object.entries(expectedScripts)) {
    test(`"${name}" script is defined with the expected command`, () => {
      assert.equal(rootPackageJson.scripts[name], command);
    });
  }

  test('does not define any unexpected scripts', () => {
    const actualNames = Object.keys(rootPackageJson.scripts).sort();
    const expectedNames = Object.keys(expectedScripts).sort();
    assert.deepEqual(actualNames, expectedNames);
  });
});

describe('root package.json scripts - internal consistency', () => {
  const scripts = rootPackageJson.scripts;

  // Extracts every `pnpm <target>` (excluding `pnpm --filter ...`) invocation
  // referenced from within a composite script's command string.
  function referencedRootScripts(command) {
    const matches = [...command.matchAll(/pnpm ([a-zA-Z0-9:_-]+)/g)];
    return matches
      .map(([, target]) => target)
      .filter((target) => target !== '--filter');
  }

  for (const composite of ['dev', 'build', 'lint', 'typecheck']) {
    test(`"${composite}" only references scripts that exist in the scripts map`, () => {
      const referenced = referencedRootScripts(scripts[composite]);
      assert.ok(referenced.length > 0, `expected "${composite}" to delegate to at least one script`);
      for (const target of referenced) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(scripts, target),
          `expected scripts["${target}"] to exist because it is referenced by "${composite}"`,
        );
      }
    });
  }

  test('"test" delegates to "test:api:e2e"', () => {
    assert.equal(scripts.test, `pnpm ${'test:api:e2e'}`);
    assert.ok(Object.prototype.hasOwnProperty.call(scripts, 'test:api:e2e'));
  });

  test('build/lint/typecheck aggregate both web and api variants', () => {
    for (const prefix of ['build', 'lint', 'typecheck']) {
      const command = scripts[prefix];
      assert.match(command, new RegExp(`pnpm ${prefix}:web`));
      assert.match(command, new RegExp(`pnpm ${prefix}:api`));
    }
  });

  test('every filtered script targets either the "web" or "api" workspace', () => {
    for (const [name, command] of Object.entries(scripts)) {
      if (command.includes('--filter')) {
        assert.match(
          command,
          /--filter (web|api)\b/,
          `script "${name}" should filter to a known workspace`,
        );
      }
    }
  });
});

describe('root package.json scripts - workspace cross-references', () => {
  test('"dev:web" and "build:web" map to scripts implemented in apps/web/package.json', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(webPackageJson.scripts, 'dev'));
    assert.ok(Object.prototype.hasOwnProperty.call(webPackageJson.scripts, 'build'));
    assert.ok(Object.prototype.hasOwnProperty.call(webPackageJson.scripts, 'lint'));
  });

  test('"dev:api", "build:api", "lint:api" and "test:api*" map to scripts implemented in apps/api/package.json', () => {
    assert.ok(Object.prototype.hasOwnProperty.call(apiPackageJson.scripts, 'start:dev'));
    assert.ok(Object.prototype.hasOwnProperty.call(apiPackageJson.scripts, 'build'));
    assert.ok(Object.prototype.hasOwnProperty.call(apiPackageJson.scripts, 'lint'));
    assert.ok(Object.prototype.hasOwnProperty.call(apiPackageJson.scripts, 'test'));
    assert.ok(Object.prototype.hasOwnProperty.call(apiPackageJson.scripts, 'test:e2e'));
  });

  test('typecheck scripts point at a tsconfig.json that exists in each workspace', () => {
    const webTsconfig = path.join(rootDir, 'apps/web/tsconfig.json');
    const apiTsconfig = path.join(rootDir, 'apps/api/tsconfig.json');

    assert.match(rootPackageJson.scripts['typecheck:web'], /-p tsconfig\.json/);
    assert.match(rootPackageJson.scripts['typecheck:api'], /-p tsconfig\.json/);

    assert.doesNotThrow(() => readFileSync(webTsconfig, 'utf8'));
    assert.doesNotThrow(() => readFileSync(apiTsconfig, 'utf8'));
  });

  test('typecheck scripts disable incremental builds so tsc always performs a full check', () => {
    assert.match(rootPackageJson.scripts['typecheck:web'], /--noEmit/);
    assert.match(rootPackageJson.scripts['typecheck:web'], /--incremental false/);
    assert.match(rootPackageJson.scripts['typecheck:api'], /--noEmit/);
    assert.match(rootPackageJson.scripts['typecheck:api'], /--incremental false/);
  });
});