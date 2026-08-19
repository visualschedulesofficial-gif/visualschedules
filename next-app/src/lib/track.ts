// Fire-and-forget activity tracking. Never blocks the UI and never throws —
// if it fails, the user must not notice.
export function track(event: string, detail?: string) {
  try {
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, detail }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
