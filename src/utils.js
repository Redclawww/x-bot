export function stripEmojis(input) {
  if (!input) return input;
  // Remove most emoji ranges
  return input.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]/gu, "");
}

export function stripHashtags(input) {
  if (!input) return input;
  return input.replace(/(^|\s)#[^\s#]+/g, "");
}

export function stripUrls(input) {
  if (!input) return input;
  return input.replace(/https?:\/\/\S+/g, "");
}

export function compressWhitespace(input) {
  return (input || "").replace(/\s+/g, " ").trim();
}

export function enforceWordLimit(input, maxWords = 50) {
  const words = (input || "").trim().split(/\s+/);
  if (words.length <= maxWords) return input.trim();
  return words.slice(0, maxWords).join(" ");
}

export function sanitizeOutput(text, maxWords = 50) {
  let t = text || "";
  // Remove block/code fences or quotes indicators that LLMs may add
  t = t.replace(/^```[\s\S]*?```$/gm, "");
  t = t.replace(/^\s*>\s?/gm, "");
  t = stripUrls(stripHashtags(stripEmojis(t)));
  t = compressWhitespace(t);
  t = enforceWordLimit(t, maxWords);
  return t;
}

export function todayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function minutesSince(dateString) {
  if (!dateString) return Infinity;
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60);
}

export function randomChoice(array) {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  const idx = Math.floor(Math.random() * array.length);
  return array[idx];
}

export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
} 