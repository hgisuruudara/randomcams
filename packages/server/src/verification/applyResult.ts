import { Gender, VerificationStatus } from '@prisma/client';
import { prisma } from '../db';
import { KycVerificationResult } from './provider';

const MINIMUM_AGE_YEARS = 18;

function isAdult(birthdate: Date, referenceDate: Date = new Date()): boolean {
  const cutoff = new Date(
    referenceDate.getFullYear() - MINIMUM_AGE_YEARS,
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  return birthdate <= cutoff;
}

function toStatus(raw: KycVerificationResult['status']): VerificationStatus {
  switch (raw) {
    case 'verified':
      return VerificationStatus.VERIFIED;
    case 'rejected':
      return VerificationStatus.REJECTED;
    case 'pending':
    default:
      return VerificationStatus.PENDING;
  }
}

export async function applyVerificationResult(userId: string, result: KycVerificationResult) {
  let status = toStatus(result.status);

  // Defense in depth: never trust a vendor "verified" status alone to grant
  // access if the extracted birthdate doesn't clear the age floor. A vendor
  // bug or bad ID scan should not be the only thing standing between a minor
  // and this app.
  if (status === VerificationStatus.VERIFIED) {
    if (!result.extractedBirthdate || !isAdult(result.extractedBirthdate)) {
      status = VerificationStatus.REJECTED;
    }
  }

  await prisma.verificationRecord.create({
    data: {
      userId,
      provider: process.env.KYC_PROVIDER ?? 'mock',
      providerReference: result.providerReference,
      status,
      extractedGender: result.extractedGender ? (result.extractedGender as Gender) : undefined,
      extractedBirthdate: result.extractedBirthdate,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationStatus: status,
      verifiedGender: status === VerificationStatus.VERIFIED ? (result.extractedGender as Gender) : undefined,
      verifiedBirthdate: status === VerificationStatus.VERIFIED ? result.extractedBirthdate : undefined,
    },
  });

  return status;
}
