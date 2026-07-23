import { Gender } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { toPrismaGender, toSharedGender } from '../../src/matching/genderMap';

describe('genderMap', () => {
  it('round-trips MALE', () => {
    expect(toSharedGender(Gender.MALE)).toBe('male');
    expect(toPrismaGender('male')).toBe(Gender.MALE);
  });

  it('round-trips FEMALE', () => {
    expect(toSharedGender(Gender.FEMALE)).toBe('female');
    expect(toPrismaGender('female')).toBe(Gender.FEMALE);
  });
});
