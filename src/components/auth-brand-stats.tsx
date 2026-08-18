export const AUTH_BRAND_STATS = [
  {
    label: "4,000 tutoring spots per year",
    icon: "spots" as const,
  },
  {
    label: "72% of our College Coaching students attend Top 10 ranked universities",
    icon: "cap" as const,
  },
  {
    label: "31 years of teaching SAT and ACT Preparation",
    icon: "years" as const,
  },
  {
    label: "7 Caring and very qualified tutors",
    icon: "tutors" as const,
  },
  {
    label: "100% Grade school admissions rate",
    icon: "badge" as const,
  },
  {
    label:
      "Impressive score improvements: 150-250 points and more for SAT & 5 points and often more for ACT",
    icon: "trend" as const,
  },
];

export function AuthStatIcon({ name }: { name: (typeof AUTH_BRAND_STATS)[number]["icon"] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "spots") {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      </svg>
    );
  }
  if (name === "cap") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 6l9 4.5-9 4.5L3 10.5z" />
        <path d="M7.5 12.5v4.2c2.4 1.5 6.6 1.5 9 0V12.5" />
      </svg>
    );
  }
  if (name === "years") {
    return (
      <svg {...common}>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9.5v4l2.5 1.5M12 5V3.5M9.5 3.5h5" />
      </svg>
    );
  }
  if (name === "tutors") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.4" />
        <circle cx="16" cy="9" r="2.1" />
        <path d="M4.5 18.5c.4-3 2.6-4.6 4.6-4.6s4.2 1.6 4.6 4.6" />
        <path d="M13.2 14.4c1.5-.4 3.3.3 4.3 2.6" />
      </svg>
    );
  }
  if (name === "badge") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 12.2 11 14.7l4.8-5.2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 16.5 10 10l3.5 3.5L20 7" />
      <path d="M14.5 7H20v5.5" />
    </svg>
  );
}
