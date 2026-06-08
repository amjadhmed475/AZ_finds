export function LogoMark() {
  return (
    <span className="az-logo" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <defs>
          <linearGradient id="azGold" x1="8" x2="40" y1="8" y2="40">
            <stop offset="0" stopColor="#ffd166" />
            <stop offset="0.55" stopColor="#f5a524" />
            <stop offset="1" stopColor="#ff7a00" />
          </linearGradient>
          <linearGradient id="azBlue" x1="14" x2="36" y1="12" y2="36">
            <stop offset="0" stopColor="#6ea8ff" />
            <stop offset="1" stopColor="#146eb4" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="#0a111c" />
        <path className="az-logo-cube" d="M15 17l9-5 9 5-9 5-9-5zM15 17v10l9 5V22M33 17v10l-9 5" fill="none" stroke="url(#azGold)" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M13 32c6.3 4.5 15.5 4.8 22 .7" fill="none" stroke="url(#azBlue)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M32.5 32.8l4.2-.4-1.4 3.9" fill="none" stroke="url(#azBlue)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
