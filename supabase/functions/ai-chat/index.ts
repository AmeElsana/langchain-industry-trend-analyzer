import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  sector: string;
  user_id: string;
  history?: { role: string; content: string }[];
}

function generateEmbedding(text: string): number[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const dim = 384;
  const vec = new Array(dim).fill(0);

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
    }
    for (let d = 0; d < dim; d++) {
      const seed = (((hash * (d + 1) * 2654435761) >>> 0) / 4294967296);
      vec[d] += (seed - 0.5) * 2;
    }
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

async function retrieveRelevantPosts(
  query: string,
  userId: string,
  sector: string
): Promise<{ title: string; content: string; source: string; url: string; similarity: number }[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const queryEmbedding = generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_posts", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_user_id: userId,
    match_sector: sector,
    match_count: 8,
  });

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    title: row.title as string,
    content: row.content as string,
    source: row.source as string,
    url: row.url as string,
    similarity: row.similarity as number,
  }));
}

async function storeMessage(
  userId: string,
  sector: string,
  role: string,
  content: string
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  await supabase.from("chat_messages").insert({
    user_id: userId,
    sector,
    role,
    content,
  });
}

async function generateResponse(
  message: string,
  sector: string,
  retrievedPosts: { title: string; content: string; source: string; url: string; similarity: number }[],
  history: { role: string; content: string }[]
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  const contextBlock = retrievedPosts.length > 0
    ? retrievedPosts
        .map(
          (p, i) =>
            `[${i + 1}] [${p.source}] "${p.title}"\n${p.content}\nURL: ${p.url}`
        )
        .join("\n\n")
    : "No relevant data found in the knowledge base for this sector.";

  const historyBlock = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const prompt = `You are EnQur AI, an expert market research assistant specializing in the "${sector}" sector. You have access to real-time data retrieved from Reddit, HackerNews, and NewsAPI via a RAG (retrieval-augmented generation) pipeline.

RETRIEVED CONTEXT (from vector similarity search over live market data):
${contextBlock}

${historyBlock ? `CONVERSATION HISTORY:\n${historyBlock}\n` : ""}
USER QUESTION: ${message}

Instructions:
- Provide a helpful, data-informed response grounded in the retrieved context
- Reference specific data points, posts, or trends from the context when relevant
- If the context doesn't contain relevant info, say so honestly
- Keep responses concise, actionable, and suitable for stakeholder decision-making
- Use a professional analyst tone`;

  if (!GEMINI_API_KEY) {
    if (retrievedPosts.length === 0) {
      return `I don't have any analyzed data for the "${sector}" sector yet. Please run a Trend Analysis first to populate the knowledge base, then come back to ask questions.`;
    }

    const topSources = retrievedPosts.slice(0, 3);
    let response = `Based on the available data for ${sector}:\n\n`;
    topSources.forEach((p, i) => {
      response += `${i + 1}. **${p.title}** (${p.source})\n   ${p.content.slice(0, 150)}...\n\n`;
    });
    response += `This information comes from ${retrievedPosts.length} relevant posts retrieved from our knowledge base. For deeper AI-powered analysis, ensure the Gemini API key is configured.`;
    return response;
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!resp.ok) {
      return `I encountered an issue generating a response. Based on ${retrievedPosts.length} retrieved posts, the most discussed topics in ${sector} relate to: ${retrievedPosts.slice(0, 3).map((p) => `"${p.title}"`).join(", ")}.`;
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return "I was unable to generate a response. Please try rephrasing your question.";
    }

    return text;
  } catch (_e) {
    return `I encountered an error. Based on retrieved data, there are ${retrievedPosts.length} relevant posts for ${sector}. Try again or rephrase your question.`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ChatRequest = await req.json();
    const { message, sector, user_id, history } = body;

    if (!message || !sector || !user_id) {
      return new Response(
        JSON.stringify({ error: "message, sector, and user_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const retrievedPosts = await retrieveRelevantPosts(message, user_id, sector);

    const response = await generateResponse(
      message,
      sector,
      retrievedPosts,
      history || []
    );

    EdgeRuntime.waitUntil(
      (async () => {
        await storeMessage(user_id, sector, "user", message);
        await storeMessage(user_id, sector, "assistant", response);
      })()
    );

    return new Response(
      JSON.stringify({
        response,
        retrieved_count: retrievedPosts.length,
        sources: retrievedPosts.slice(0, 5).map((p) => ({
          title: p.title,
          source: p.source,
          url: p.url,
          similarity: Math.round(p.similarity * 100) / 100,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
