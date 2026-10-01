// Loads a saved schedule into the mobile builder's draft and opens /schedule.
// Shared by the home screen and the child "do" view's Edit button.

export async function openScheduleForEdit(id: string, go: (href: string) => void) {
  try {
    const full = await fetch(`/api/schedules/${id}`, { cache: "no-store" }).then((r) => r.json());
    if (!full?.id) { alert("Couldn't open that schedule — please try again."); return; }
    sessionStorage.setItem("vs_active_schedule_id", full.id);
    const pages = full.data?.pages || [];
    // miniCardCount isn't stored; derive it so a 5-step schedule reopens with 5 slots.
    let cardCount = 0;
    for (const p of pages) {
      cardCount += (p?.slots || []).filter(Boolean).length;
      for (const col of Object.values(p?.columns || {})) cardCount += (col as unknown[])?.length || 0;
    }
    sessionStorage.setItem("vs_draft_mobile_schedule", JSON.stringify({
      id: full.id, title: full.title, scheduleType: full.scheduleType, language: full.language,
      gender: full.gender, gridCols: full.gridCols, miniCardCount: Math.min(5, Math.max(2, cardCount)), pages,
    }));
    go("/schedule");
  } catch {
    alert("Couldn't open that schedule — check your connection.");
  }
}
