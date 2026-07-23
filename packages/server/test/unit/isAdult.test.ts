import { describe, expect, it } from 'vitest';
import { isAdult } from '../../src/verification/applyResult';

describe('isAdult', () => {
  const reference = new Date('2026-07-23T00:00:00Z');

  it('rejects someone who turns 18 tomorrow', () => {
    expect(isAdult(new Date('2008-07-24'), reference)).toBe(false);
  });

  it('accepts someone who turned 18 today', () => {
    expect(isAdult(new Date('2008-07-23'), reference)).toBe(true);
  });

  it('accepts someone who turned 18 yesterday', () => {
    expect(isAdult(new Date('2008-07-22'), reference)).toBe(true);
  });

  it('rejects a clearly underage birthdate', () => {
    expect(isAdult(new Date('2015-01-01'), reference)).toBe(false);
  });

  it('accepts a clearly adult birthdate', () => {
    expect(isAdult(new Date('1990-01-01'), reference)).toBe(true);
  });
});
