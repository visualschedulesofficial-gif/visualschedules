// The course is one JSON document (title, intro, chapters with YouTube
// links). It lives in a table created on first use, like leads, so no
// migration is needed — see the note in api/leads/route.ts.

export type Chapter = {
  id: string;
  title: string;
  youtubeUrl: string;
  description?: string;
  duration?: string;
};

export type Course = {
  title: string;
  intro: string;
  published: boolean;
  chapters: Chapter[];
};

export const EMPTY_COURSE: Course = { title: "Visual Schedules Course", intro: "", published: false, chapters: [] };

export function youTubeId(url: string): string | null {
  const m = (url || "").trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test((url || "").trim()) ? url.trim() : null;
}

async function ensureTable(db: any) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS site_content (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL,
       updated_at TEXT NOT NULL DEFAULT (datetime('now'))
     )`
  ).run();
}

export function cleanCourse(raw: any): Course {
  const chapters = Array.isArray(raw?.chapters) ? raw.chapters : [];
  return {
    title: String(raw?.title || EMPTY_COURSE.title).slice(0, 160),
    intro: String(raw?.intro || "").slice(0, 4000),
    published: !!raw?.published,
    chapters: chapters.slice(0, 200).map((c: any) => ({
      id: String(c?.id || crypto.randomUUID()).slice(0, 64),
      title: String(c?.title || "").slice(0, 200),
      youtubeUrl: String(c?.youtubeUrl || "").slice(0, 300),
      description: String(c?.description || "").slice(0, 4000),
      duration: String(c?.duration || "").slice(0, 20),
    })),
  };
}

export async function getCourse(db: any): Promise<Course> {
  if (!db) return EMPTY_COURSE;
  try {
    await ensureTable(db);
    const row = await db.prepare("SELECT value FROM site_content WHERE key = 'course'").first();
    return row?.value ? cleanCourse(JSON.parse(row.value)) : EMPTY_COURSE;
  } catch {
    return EMPTY_COURSE;
  }
}

export async function saveCourse(db: any, course: Course) {
  await ensureTable(db);
  await db.prepare(
    `INSERT INTO site_content (key, value, updated_at) VALUES ('course', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(JSON.stringify(course)).run();
}
