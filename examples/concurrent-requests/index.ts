import type { ApiRequest, InterviewPattern } from "@/interviews/types";
import ConcurrentRequestsChallenge from "./ConcurrentRequestsChallenge";

const ITEM_COUNT = 6;
const REQUEST_DELAY_MS = 1000;

const itemSummaries = Array.from({ length: ITEM_COUNT }, (_, index) => ({
  id: index + 1,
  name: `Item ${index + 1}`,
}));

const itemDetails = itemSummaries.map((item, index) => ({
  ...item,
  status: "healthy",
  owner: ["Ada", "Grace", "Linus", "Margaret", "Barbara", "Donald"][index],
  score: 90 + index,
}));

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const pattern: InterviewPattern = {
  id: "concurrent-requests",
  name: "Concurrent Requests",
  description:
    "Refactor sequential item detail requests so they run concurrently.",
  version: "1.0.0",
  author: "Codeflow",
  estimatedTime: "15-20 minutes",
  tags: ["react", "fetch", "async", "performance"],
  type: "react",
  component: ConcurrentRequestsChallenge,
  readmes: [
    {
      title: "Instructions",
      content: `
# Concurrent Requests

## Objective
The dashboard loads a list of ${ITEM_COUNT} items and then fetches details for each item.

Each detail request takes about ${REQUEST_DELAY_MS / 1000} second. The current implementation waits for one request to finish before starting the next, so the full load takes about ${ITEM_COUNT} seconds.

Your task is to update the React code so the item detail requests happen concurrently. After the change, the full load should take around 1 second instead of around ${ITEM_COUNT} seconds.

## Requirements
1. Keep the initial request that loads the item list.
2. Refactor the item detail requests so they start at the same time.
3. Preserve the existing loading, error, and rendered table behavior.
4. Avoid changing the mock API route handlers.

## Hint
\`Promise.all\` is usually the right tool when multiple independent async operations can run at the same time.
      `.trim(),
    },
  ],
  routes: [
    {
      method: "GET",
      path: "/api/concurrent-requests/items",
      handler: async () => itemSummaries,
    },
    {
      method: "GET",
      path: "/api/concurrent-requests/items/:id",
      handler: async (req: ApiRequest) => {
        await wait(REQUEST_DELAY_MS);

        const id = Number(req.params.id);
        const item = itemDetails.find((entry) => entry.id === id);

        if (!item) {
          throw new Error(`Item ${req.params.id} not found`);
        }

        return item;
      },
    },
  ],
};
