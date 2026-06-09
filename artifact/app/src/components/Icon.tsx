// Lightweight Lucide-style inline SVG icons (24x24, stroke). No emoji.
const P: Record<string, string> = {
  target: "M12 2v3M12 19v3M2 12h3M19 12h3 M12 8a4 4 0 100 8 4 4 0 000-8z M12 4a8 8 0 100 16 8 8 0 000-16z",
  dashboard: "M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  megaphone: "M3 11l15-6v14L3 13zM3 11v4a2 2 0 002 2h1v-8H5a2 2 0 00-2 2z",
  wallet: "M3 6h16a2 2 0 012 2v8a2 2 0 01-2 2H3zM3 6V5a2 2 0 012-2h11M17 12h.01",
  ban: "M12 2a10 10 0 100 20 10 10 0 000-20zM5 5l14 14",
  database: "M12 2c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  bolt: "M13 2L3 14h7l-1 8 10-12h-7z",
  box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  external: "M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5",
  chevron: "M9 6l6 6-6 6",
  refresh: "M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5",
  star: "M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 9.4l6.9-.6z",
  help: "M12 2a10 10 0 100 20 10 10 0 000-20z M9.6 9a2.5 2.5 0 014.6 1.4c0 1.6-2.2 2-2.2 3.3 M12 17h.01",
  info: "M12 2a10 10 0 100 20 10 10 0 000-20z M12 11v5 M12 7h.01",
  shield: "M12 2l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V5l8-3z M9 12l2 2 4-4",
  rocket: "M14.5 4.5c3.5-1.5 5 0 5 0s1.5 1.5 0 5l-7.5 7.5-3-3 5.5-9.5z M9 11l-4 1 1 3 M5 15c-1.2 1.2-1.5 4.2-1.5 4.2s3-.3 4.2-1.5",
};

export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const d = P[name] || P.box;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(" M").map((seg, i) => <path key={i} d={(i === 0 ? seg : "M" + seg)} />)}
    </svg>
  );
}
