import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <h1 className="font-display font-black text-ink text-6xl mb-4">404</h1>
      <p className="text-dust text-lg mb-8">Page not found</p>
      <Link
        href="/"
        className="text-amber hover:text-ink transition-colors font-body uppercase text-sm tracking-widest"
      >
        ← Back to home
      </Link>
    </div>
  );
}
