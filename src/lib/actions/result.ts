/** Shared result shape for write-path server actions — no throwing across the boundary. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
