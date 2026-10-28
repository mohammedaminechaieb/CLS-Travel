import { PackageStatus } from '@prisma/client';

/** Machine à états des offres : draft → published → archived (→ draft pour réédition). */
export const PACKAGE_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  draft: [PackageStatus.published, PackageStatus.archived],
  published: [PackageStatus.draft, PackageStatus.archived],
  archived: [PackageStatus.draft],
};

export function canTransitionPackage(from: PackageStatus, to: PackageStatus): boolean {
  return from === to || PACKAGE_TRANSITIONS[from].includes(to);
}
