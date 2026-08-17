import Link from "next/link";
import {
  DirectoryCardFields,
  type DirectoryCardFieldSlot,
} from "@/components/directory-card-fields";

/** Compact dashboard row: labeled columns fill the card width. */
export function StaffDashboardEntityCard({
  href,
  fields,
}: {
  href: string;
  fields: DirectoryCardFieldSlot[];
}) {
  return (
    <Link href={href} className="dashboard-entity-card">
      <DirectoryCardFields fields={fields} className="mini-fields dashboard-entity-fields" />
    </Link>
  );
}
