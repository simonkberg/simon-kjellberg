import { MAX_PER_CATEGORY } from "@/lib/memory";
import { query } from "@/lib/turso";

export const CREATED_AT = "2025-01-01T00:00:00.000Z";

// Needs @/lib/turso mocked with sqliteBeforeEach, and the real @/lib/memory for MAX_PER_CATEGORY.

export async function seed(
  id: number,
  category: string,
  content: string,
  createdAt = CREATED_AT,
) {
  await query(
    "INSERT INTO memories (id, category, content, created_at) VALUES (?, ?, ?, ?)",
    [id, category, content, createdAt],
  );
}

export async function fillCategory(category: string, count = MAX_PER_CATEGORY) {
  for (let i = 0; i < count; i++) {
    await seed(100 + i, category, `note ${i}`);
  }
}

export async function stored(id: number) {
  const { rows } = await query(
    "SELECT category, content FROM memories WHERE id = ?",
    [id],
  );
  return rows[0];
}
