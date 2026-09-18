export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
          S
        </div>

        <h1 className="mt-4 text-xl font-bold text-white">
          Saiful Store
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Loading...
        </p>

        <div className="mx-auto mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
        </div>
      </div>
    </main>
  );
}
