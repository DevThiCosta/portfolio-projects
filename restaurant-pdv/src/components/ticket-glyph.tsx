export function TicketGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 4h14a1 1 0 0 1 1 1v3.25a1.75 1.75 0 0 0 0 3.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.25a1.75 1.75 0 0 0 0-3.5V5a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 9h8M8 12.3h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
