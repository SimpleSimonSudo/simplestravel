"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <h1 className="font-display font-black text-ink text-6xl mb-4">Oops!</h1>
      <p className="text-dust text-lg mb-8">Something went wrong</p>
      <button
        onClick={reset}
        className="text-amber hover:text-ink transition-colors font-body uppercase text-sm tracking-widest"
      >
        Try again
      </button>
    </div>
  );
}
