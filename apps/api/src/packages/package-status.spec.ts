import { PackageStatus } from '@prisma/client';
import { canTransitionPackage } from './package-status';

describe('package status machine', () => {
  it.each([
    [PackageStatus.draft, PackageStatus.published, true],
    [PackageStatus.published, PackageStatus.archived, true],
    [PackageStatus.archived, PackageStatus.draft, true],
    [PackageStatus.archived, PackageStatus.published, false],
    [PackageStatus.published, PackageStatus.published, true],
  ])('%s → %s = %s', (from, to, expected) => {
    expect(canTransitionPackage(from, to)).toBe(expected);
  });
});
