import { sql } from "./client";
import { extractHashtags } from "./hashtags";

export interface DayCount {
  date: string;
  paragraphCount: number;
}

export interface Paragraph {
  id: number;
  body: string;
  position: number;
  hashtags: string[];
  createdAt: string;
}

export interface DayEntry {
  date: string;
  paragraphs: Paragraph[];
}

export interface TaggedParagraph extends Paragraph {
  date: string;
}

function requireDb(): NonNullable<typeof sql> {
  if (!sql) throw new Error("DATABASE_URL not configured");
  return sql;
}

export async function getParagraphCountsByDateRange(
  start: string,
  end: string,
): Promise<DayCount[]> {
  const db = requireDb();
  const rows = await db<{ entry_date: string; count: number }[]>`
    SELECT to_char(e.entry_date, 'YYYY-MM-DD') AS entry_date,
           COUNT(p.id)::int AS count
    FROM diary_entries e
    LEFT JOIN paragraphs p ON p.entry_id = e.id
    WHERE e.entry_date BETWEEN ${start} AND ${end}
    GROUP BY e.entry_date
  `;
  return rows.map((r) => ({ date: r.entry_date, paragraphCount: r.count }));
}

export async function getEntryByDate(date: string): Promise<DayEntry | null> {
  const db = requireDb();
  const [entry] = await db<{ id: number }[]>`
    SELECT id FROM diary_entries WHERE entry_date = ${date}
  `;
  if (!entry) return null;

  const rows = await db<
    { id: number; body: string; position: number; created_at: string; tags: string[] | null }[]
  >`
    SELECT p.id, p.body, p.position, p.created_at,
           ARRAY(
             SELECT tag FROM paragraph_hashtags h WHERE h.paragraph_id = p.id ORDER BY tag
           ) AS tags
    FROM paragraphs p
    WHERE p.entry_id = ${entry.id}
    ORDER BY p.position ASC
  `;

  return {
    date,
    paragraphs: rows.map((r) => ({
      id: r.id,
      body: r.body,
      position: r.position,
      hashtags: r.tags ?? [],
      createdAt: r.created_at,
    })),
  };
}

export async function createParagraph(input: {
  date: string;
  body: string;
}): Promise<Paragraph> {
  const db = requireDb();
  const tags = extractHashtags(input.body);

  const result = await db.begin(async (tx) => {
    const [entry] = await tx<{ id: number }[]>`
      INSERT INTO diary_entries (entry_date) VALUES (${input.date})
      ON CONFLICT (entry_date) DO UPDATE SET updated_at = now()
      RETURNING id
    `;
    const [{ next_pos }] = await tx<{ next_pos: number }[]>`
      SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
      FROM paragraphs WHERE entry_id = ${entry!.id}
    `;
    const [paragraph] = await tx<
      { id: number; body: string; position: number; created_at: string }[]
    >`
      INSERT INTO paragraphs (entry_id, body, position)
      VALUES (${entry!.id}, ${input.body}, ${next_pos})
      RETURNING id, body, position, created_at
    `;
    if (tags.length) {
      await tx`
        INSERT INTO paragraph_hashtags ${tx(
          tags.map((t) => ({ paragraph_id: paragraph!.id, tag: t })),
        )}
        ON CONFLICT DO NOTHING
      `;
    }
    return paragraph!;
  });

  return {
    id: result.id,
    body: result.body,
    position: result.position,
    hashtags: tags,
    createdAt: result.created_at,
  };
}

export async function searchByTags(tags: string[]): Promise<TaggedParagraph[]> {
  if (tags.length === 0) return [];
  const db = requireDb();
  const normalized = [
    ...new Set(tags.map((t) => t.toLowerCase().replace(/^#/, "")).filter(Boolean)),
  ];
  if (normalized.length === 0) return [];

  const rows = await db<
    {
      id: number;
      body: string;
      position: number;
      created_at: string;
      entry_date: string;
      tags: string[] | null;
    }[]
  >`
    SELECT p.id, p.body, p.position, p.created_at,
           to_char(e.entry_date, 'YYYY-MM-DD') AS entry_date,
           ARRAY(
             SELECT tag FROM paragraph_hashtags h2 WHERE h2.paragraph_id = p.id ORDER BY tag
           ) AS tags
    FROM paragraphs p
    JOIN diary_entries e ON e.id = p.entry_id
    WHERE EXISTS (
      SELECT 1 FROM paragraph_hashtags h
      WHERE h.paragraph_id = p.id AND h.tag = ANY(${normalized})
    )
    ORDER BY e.entry_date DESC, p.position ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    position: r.position,
    hashtags: r.tags ?? [],
    createdAt: r.created_at,
    date: r.entry_date,
  }));
}

export interface TagCount {
  tag: string;
  count: number;
}

export async function getAllTags(): Promise<TagCount[]> {
  const db = requireDb();
  const rows = await db<{ tag: string; count: number }[]>`
    SELECT tag, COUNT(*)::int AS count
    FROM paragraph_hashtags
    GROUP BY tag
    ORDER BY count DESC, tag ASC
  `;
  return rows.map((r) => ({ tag: r.tag, count: r.count }));
}
