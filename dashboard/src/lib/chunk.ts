// Word-count-based approximation of ~300-500 token chunks (1 token ≈ 0.75
// words), with overlap so a fact split across a boundary stays retrievable.
const WORDS_PER_CHUNK = 350;
const OVERLAP_WORDS = 40;

export function chunkText(text: string): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + WORDS_PER_CHUNK, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - OVERLAP_WORDS;
  }
  return chunks;
}
