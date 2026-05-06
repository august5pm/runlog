export default function MainLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6 px-4 py-6">
      <div className="h-9 w-40 rounded-md bg-border" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-card bg-border" />
        <div className="h-24 rounded-card bg-border" />
        <div className="h-24 rounded-card bg-border" />
      </div>
      <div className="h-72 rounded-card bg-border" />
    </div>
  );
}
