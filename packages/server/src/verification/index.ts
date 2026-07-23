import { KycProvider } from './provider';
import { MockKycProvider } from './mockProvider';

export function getKycProvider(): KycProvider {
  const providerName = process.env.KYC_PROVIDER ?? 'mock';

  switch (providerName) {
    case 'mock':
      return new MockKycProvider();
    default:
      // Add a real implementation under src/verification/providers/<name>.ts
      // and wire it in here before setting KYC_PROVIDER to anything but "mock".
      throw new Error(
        `KYC provider "${providerName}" has no implementation yet. Only "mock" is available.`
      );
  }
}

export * from './provider';
