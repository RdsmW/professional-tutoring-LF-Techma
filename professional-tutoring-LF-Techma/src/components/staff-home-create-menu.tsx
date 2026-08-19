import Link from "next/link";

/** Dashboard hero CTAs — keep `from=dashboard` for cancel return to `/staff`. */
export function StaffHomeHeroActions() {
  return (
    <div className="hero-actions staff-dashboard-hero-actions">
      <Link
        href="/staff/families?new=1&from=dashboard"
        className="primary-button"
        style={{ textDecoration: "none" }}
      >
        New family
      </Link>
      <Link
        href="/staff/tutors?new=1&from=dashboard"
        className="secondary-button"
        style={{ textDecoration: "none" }}
      >
        New tutor
      </Link>
    </div>
  );
}
