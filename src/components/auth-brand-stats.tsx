export const AUTH_BRAND_STATS = [
  {
    label: "72% of our College Coaching students attend Top 10 ranked universities",
    icon: "cap" as const,
  },
  {
    label: "31 years of teaching SAT and ACT Preparation",
    icon: "years" as const,
  },
  {
    label: "SAT +150–250 · ACT +5 and more",
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
  return (
    <svg {...common}>
      <path d="M4 16.5 10 10l3.5 3.5L20 7" />
      <path d="M14.5 7H20v5.5" />
    </svg>
  );
}
