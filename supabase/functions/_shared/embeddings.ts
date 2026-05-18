// Embeddings via Lovable AI Gateway (Google text-embedding-004, 768 dims)
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
  if (texts.length === 0) return [];

  const res = await fetch(`${GATEWAY_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
      "X-Lovable-AIG-SDK": "edge-function",
    },
    body: JSON.stringify({
      model: "google/text-embedding-004",
      input: texts,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Embeddings failed ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const data = json?.data ?? [];
  return data.map((d: { embedding: number[] }) => d.embedding);
}

export function chunkText(text: string, maxChars = 1200, overlap = 150): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + maxChars, clean.length);
    let slice = clean.slice(i, end);
    // try to break on sentence
    if (end < clean.length) {
      const lastDot = slice.lastIndexOf(". ");
      if (lastDot > maxChars * 0.5) slice = slice.slice(0, lastDot + 1);
    }
    chunks.push(slice.trim());
    i += slice.length - overlap;
    if (i <= 0) break;
  }
  return chunks.filter((c) => c.length > 0);
}
