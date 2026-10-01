// First/Then boards: each A4 page holds several boards stacked with cut
// lines between them, so a parent prints once and cuts out ready boards.
// Board 0 keeps the original column keys ("0", "1", …) so older saved
// schedules still line up; later boards use "b{board}c{col}".

type Cols = Record<string, ({ cardId?: string } | null)[]> | undefined;

export function ftColumnCount(ftStyle: string): 2 | 3 | 4 {
  return ftStyle === "sequencing" ? 4 : ftStyle === "first-then-now" ? 3 : 2;
}

export function ftBoardsPerPage(n: number): number {
  return n === 4 ? 4 : 3;
}

export function ftKey(board: number, col: number): string {
  return board === 0 ? String(col) : `b${board}c${col}`;
}

export function ftKeys(n: number): string[][] {
  return Array.from({ length: ftBoardsPerPage(n) }, (_, b) => Array.from({ length: n }, (_, c) => ftKey(b, c)));
}

export function ftNextEmpty(columns: Cols, n: number): string | null {
  for (const row of ftKeys(n)) for (const k of row) if (!(columns?.[k] || []).length) return k;
  return null;
}

// Sort rank for column keys so boards read in order after "0"/"1"/days.
export function ftRank(k: string): number | null {
  const m = k.match(/^b(\d+)c(\d+)$/);
  return m ? 1000 + Number(m[1]) * 10 + Number(m[2]) : null;
}
