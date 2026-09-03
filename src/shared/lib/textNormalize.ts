/** Case/accent-insensitive normalization for free-text matching (Greek diacritics included). */
export function normalizeForMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
