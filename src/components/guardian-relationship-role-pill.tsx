import {
  formatGuardianRelationshipRole,
  guardianRelationshipRoleTone,
  type GuardianRelationshipRole,
} from "@/lib/staff/guardian-shared";

type Props = {
  role: GuardianRelationshipRole | null | undefined;
};

/** Status-style pill for Parent 1 / Parent 2; empty roles stay a plain em dash. */
export function GuardianRelationshipRolePill({ role }: Props) {
  const label = formatGuardianRelationshipRole(role);
  const tone = guardianRelationshipRoleTone(role);
  if (!label || !tone) return "—";
  return <span className={`pill ${tone}`}>{label}</span>;
}
