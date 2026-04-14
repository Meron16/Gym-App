import { api } from "./apiClient";
import { getProfileId } from "./sessionStore";

/** Fire-and-forget product analytics (Phase 6). Names: lowercase snake_case, e.g. plans_view */
export function track(event: string, props?: Record<string, unknown>): void {
  void (async () => {
    try {
      const userId = (await getProfileId()) ?? undefined;
      await api.trackAnalytics({ event, userId, props });
    } catch {
      /* non-fatal */
    }
  })();
}
