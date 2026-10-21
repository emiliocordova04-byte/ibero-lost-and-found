// Brand mark: a luggage-tag shaped pin with a keyhole, drawn as inline SVG so
// there is no image request and it recolors with the theme.
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#D8281E" />
      <path
        d="M20 8c-5.2 0-9 3.9-9 8.8 0 6.2 7 12.6 8.1 13.6a1.4 1.4 0 0 0 1.8 0C22 29.4 29 23 29 16.8 29 11.9 25.2 8 20 8Z"
        fill="#fff"
      />
      <circle cx="20" cy="16.5" r="3.4" fill="#D8281E" />
      <rect x="19" y="18" width="2" height="5" rx="1" fill="#D8281E" />
    </svg>
  );
}

export default function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-[1.15rem] font-bold leading-none tracking-tight">
        Ibero <span className="text-brand">Lost &amp; Found</span>
      </span>
    </span>
  );
}
