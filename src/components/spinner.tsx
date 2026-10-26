/** Small inline progress indicator for buttons and status lines; hidden with reduced motion. */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="animate-spin motion-reduce:hidden"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.56" strokeLinecap="square" />
    </svg>
  );
}
