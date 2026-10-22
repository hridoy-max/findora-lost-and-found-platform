/**
 * Ensures list responses are always treated as arrays.
 * Handles both plain arrays and { data: [] } paginated responses.
 */
export function normalizeList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
}
