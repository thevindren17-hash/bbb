import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export async function embedTexts(
  texts: string[]
): Promise<{ embeddings: number[][]; promptTokens: number }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return {
    embeddings: response.data.map((d) => d.embedding),
    promptTokens: response.usage?.prompt_tokens ?? 0,
  };
}
