export default function Logo() {
  return (
    <div className="brand">
      <svg viewBox="0 0 68 48" aria-hidden="true">
        <path
          d="M8 34C8 18 22 10 30 20c4 5 2 14-6 13-7-1-4-12 10-15 13-3 26 4 26 16"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="34" r="5" fill="var(--ink)" />
        <circle cx="60" cy="34" r="5" fill="var(--ink)" />
      </svg>
      <span>
        Fil<b>amour</b>
      </span>
    </div>
  );
}
