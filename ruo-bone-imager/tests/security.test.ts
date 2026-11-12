import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  randomToken,
  safeFixtureSrc,
  safeLabel,
} from '../src/util/security.ts';

describe('security helpers (CodeQL)', () => {
  it('randomToken uses crypto length and hex charset', () => {
    const token = randomToken(4);
    assert.equal(token.length, 8);
    assert.match(token, /^[0-9a-f]+$/);
    assert.notEqual(randomToken(4), randomToken(4));
  });

  it('safeFixtureSrc allowlists local fixtures only', () => {
    assert.equal(
      safeFixtureSrc('/fixtures/cine/frame-0.svg'),
      '/fixtures/cine/frame-0.svg',
    );
    assert.equal(safeFixtureSrc('/fixtures/sample-bmode.svg'), '/fixtures/sample-bmode.svg');
    assert.equal(
      safeFixtureSrc('javascript:alert(1)'),
      '/fixtures/sample-bmode.svg',
    );
    assert.equal(
      safeFixtureSrc('https://evil.example/x.svg'),
      '/fixtures/sample-bmode.svg',
    );
    assert.equal(
      safeFixtureSrc('/fixtures/../etc/passwd.svg'),
      '/fixtures/sample-bmode.svg',
    );
  });

  it('safeLabel strips markup-ish characters', () => {
    assert.equal(safeLabel('frame-0'), 'frame-0');
    assert.equal(safeLabel('<img src=x onerror=1>'), 'imgsrcxonerror1');
  });
});
