export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 shadow-lg shadow-brand-500/40"
      style={{ width: size, height: size }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2 text-white">
        <path
          d="M15 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3.5l4 3.5v-11l-4 3.5z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
