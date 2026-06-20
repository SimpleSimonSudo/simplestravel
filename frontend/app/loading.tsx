export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-dust text-sm font-body uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}
