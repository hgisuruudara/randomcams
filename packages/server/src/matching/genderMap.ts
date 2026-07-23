import { Gender } from '@prisma/client';
import { VerifiedGender } from '@randomcams/shared';

export function toSharedGender(gender: Gender): VerifiedGender {
  return gender === Gender.MALE ? 'male' : 'female';
}

export function toPrismaGender(gender: VerifiedGender): Gender {
  return gender === 'male' ? Gender.MALE : Gender.FEMALE;
}
