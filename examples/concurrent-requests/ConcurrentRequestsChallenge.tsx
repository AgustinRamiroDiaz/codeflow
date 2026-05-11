import React, { useEffect, useState } from "react";

interface ItemSummary {
  id: number;
  name: string;
}

interface ItemDetails extends ItemSummary {
  status: string;
  owner: string;
  score: number;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

export default function ConcurrentRequestsChallenge() {
  const [items, setItems] = useState<ItemDetails[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setState("loading");
      setError(null);
      setItems([]);
      setElapsedMs(null);

      const startedAt = performance.now();

      try {
        const listResponse = await fetch("/api/concurrent-requests/items");
        if (!listResponse.ok) {
          throw new Error("Failed to load item list");
        }

        const summaries = (await listResponse.json()) as ItemSummary[];
        const loadedItems: ItemDetails[] = [];

        for (const item of summaries) {
          const detailsResponse = await fetch(
            `/api/concurrent-requests/items/${item.id}`
          );

          if (!detailsResponse.ok) {
            throw new Error(`Failed to load item ${item.id}`);
          }

          const details = (await detailsResponse.json()) as ItemDetails;
          loadedItems.push(details);

          if (!cancelled) {
            setItems([...loadedItems]);
          }
        }

        if (!cancelled) {
          setElapsedMs(Math.round(performance.now() - startedAt));
          setState("loaded");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setState("error");
        }
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const seconds = elapsedMs === null ? null : (elapsedMs / 1000).toFixed(2);

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-8 py-8">
        <section className="border-b border-zinc-200 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Inventory Health Check</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                This dashboard loads a list of items, then requests details for
                each item. The current implementation is correct but slow.
              </p>
            </div>
            <div className="rounded border border-zinc-200 bg-white px-4 py-3 text-right">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Load time
              </div>
              <div className="text-2xl font-semibold">
                {seconds === null ? "--" : `${seconds}s`}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Items</h2>
            <span className="text-sm text-zinc-500">
              {state === "loading"
                ? `Loaded ${items.length} item${items.length === 1 ? "" : "s"}`
                : `${items.length} total`}
            </span>
          </div>

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded border border-zinc-200 bg-white">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="w-24 px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="w-24 px-4 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{item.owner}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{item.score}</td>
                  </tr>
                ))}

                {state === "loading" ? (
                  <tr className="border-t border-zinc-100">
                    <td className="px-4 py-5 text-sm text-zinc-500" colSpan={5}>
                      Loading item details...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
