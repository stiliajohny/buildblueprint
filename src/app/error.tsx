"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>Something went wrong</h1>
      <p>Your local blueprint is still stored in this browser.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
