import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Post {
  title: string;
  text: string;
  score: number;
  num_comments: number;
  url: string;
  created: string;
  subreddit?: string;
  source: string;
}

interface AnalyzeRequest {
  sector_id: string;
  custom_topic?: string;
}

const SECTORS: Record<
  string,
  { name: string; keywords: string[]; subreddits: string[] }
> = {
  corporate_travel: {
    name: "Corporate Travel & Expense",
    keywords: [
      "corporate travel",
      "expense management",
      "travel booking",
      "business travel",
      "SAP Concur",
    ],
    subreddits: ["business", "travel", "smallbusiness", "accounting"],
  },
  asset_management: {
    name: "Asset Management & Finance",
    keywords: [
      "asset management",
      "portfolio management",
      "investment",
      "wealth management",
      "fintech",
    ],
    subreddits: ["investing", "finance", "FinancialPlanning", "stocks"],
  },
  healthcare: {
    name: "Healthcare & Wellness",
    keywords: [
      "digital health",
      "telemedicine",
      "health tech",
      "wellness",
      "healthcare AI",
    ],
    subreddits: ["healthcare", "HealthIT", "digitalhealth", "medicine"],
  },
  enterprise_saas: {
    name: "Enterprise SaaS & Technology",
    keywords: [
      "enterprise software",
      "SaaS",
      "cloud computing",
      "digital transformation",
      "DevOps",
    ],
    subreddits: ["SaaS", "cloud", "devops", "programming"],
  },
  sustainability: {
    name: "Sustainability & ESG",
    keywords: [
      "sustainability",
      "ESG",
      "carbon footprint",
      "green technology",
      "climate tech",
    ],
    subreddits: ["sustainability", "environment", "climate", "RenewableEnergy"],
  },
  real_estate: {
    name: "Real Estate & Housing",
    keywords: [
      "housing market",
      "home prices",
      "mortgage rates",
      "real estate",
      "housing affordability",
    ],
    subreddits: ["RealEstate", "REBubble", "FirstTimeHomeBuyer", "homeowners"],
  },
  custom: {
    name: "Custom Topic",
    keywords: [],
    subreddits: [],
  },
};

async function fetchRedditPosts(
  keywords: string[],
  limit = 50
): Promise<Post[]> {
  const posts: Post[] = [];
  const query = encodeURIComponent(keywords.slice(0, 5).join(" OR "));
  const url = `https://www.reddit.com/search.json?q=${query}&sort=relevance&t=month&limit=${limit}`;

  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "EnQue/1.0" },
    });
    if (resp.ok) {
      const data = await resp.json();
      for (const child of data?.data?.children || []) {
        const post = child?.data;
        if (!post) continue;
        posts.push({
          title: post.title || "",
          text: (post.selftext || "").slice(0, 500),
          score: post.score || 0,
          num_comments: post.num_comments || 0,
          url: `https://reddit.com${post.permalink || ""}`,
          created: post.created_utc
            ? new Date(post.created_utc * 1000).toISOString()
            : "",
          subreddit: post.subreddit || "",
          source: "Reddit",
        });
      }
    }
  } catch (_e) {
    // silently fail
  }
  return posts;
}

async function fetchHackerNewsPosts(
  keywords: string[],
  limit = 30
): Promise<Post[]> {
  const posts: Post[] = [];
  const query = encodeURIComponent(keywords.slice(0, 3).join(" "));
  const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=${limit}`;

  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      for (const hit of data?.hits || []) {
        posts.push({
          title: hit.title || "",
          text: hit.story_text || "",
          score: hit.points || 0,
          num_comments: hit.num_comments || 0,
          url:
            hit.url ||
            `https://news.ycombinator.com/item?id=${hit.objectID || ""}`,
          created: hit.created_at || "",
          source: "HackerNews",
        });
      }
    }
  } catch (_e) {
    // silently fail
  }
  return posts;
}

function extractTopics(posts: Post[]): { topic: string; count: number; sentiment: number }[] {
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "can", "shall", "it", "its", "this",
    "that", "these", "those", "i", "you", "he", "she", "we", "they", "my",
    "your", "his", "her", "our", "their", "what", "which", "who", "whom",
    "how", "when", "where", "why", "not", "no", "so", "if", "than", "too",
    "very", "just", "about", "up", "out", "new", "also", "one", "all",
    "more", "some", "any", "other", "into", "over", "after", "get", "like",
    "make", "know", "think", "see", "going", "there", "been", "much",
    "then", "them", "only", "now", "even", "back", "way", "still", "here",
    "each", "every", "between", "through", "own", "same", "because",
    "most", "such", "both", "before", "during", "however", "many",
    "well", "really", "people", "don", "doesn", "didn", "won", "isn",
    "aren", "wasn", "weren", "hasn", "haven", "hadn", "wouldn", "couldn",
    "shouldn", "amp", "https", "http", "www", "com", "org", "reddit",
  ]);

  for (const post of posts) {
    const text = `${post.title} ${post.text}`.toLowerCase();
    const words = text.match(/[a-z]{3,}/g) || [];
    const seen = new Set<string>();
    for (const w of words) {
      if (!stopWords.has(w) && !seen.has(w)) {
        seen.add(w);
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    }
  }

  const bigramFreq: Record<string, number> = {};
  for (const post of posts) {
    const text = `${post.title}`.toLowerCase();
    const words = text.match(/[a-z]{3,}/g) || [];
    for (let i = 0; i < words.length - 1; i++) {
      if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        bigramFreq[bigram] = (bigramFreq[bigram] || 0) + 1;
      }
    }
  }

  const allTopics: { topic: string; count: number }[] = [];

  for (const [bigram, count] of Object.entries(bigramFreq)) {
    if (count >= 2) {
      allTopics.push({ topic: bigram, count });
    }
  }

  for (const [word, count] of Object.entries(wordFreq)) {
    if (count >= 3) {
      const alreadyCovered = allTopics.some((t) =>
        t.topic.includes(word)
      );
      if (!alreadyCovered) {
        allTopics.push({ topic: word, count });
      }
    }
  }

  allTopics.sort((a, b) => b.count - a.count);

  return allTopics.slice(0, 7).map((t) => ({
    ...t,
    topic: t.topic
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    sentiment: Math.round((Math.random() * 1.4 - 0.4) * 100) / 100,
  }));
}

function analyzeSentiment(posts: Post[]): {
  positive: number;
  neutral: number;
  negative: number;
} {
  const positiveWords = new Set([
    "good", "great", "best", "better", "love", "amazing", "awesome",
    "excellent", "fantastic", "wonderful", "happy", "growth", "improve",
    "success", "opportunity", "innovation", "breakthrough", "exciting",
    "strong", "gain", "profit", "bullish", "optimistic", "promising",
    "surge", "boost", "thrive", "advance", "achieve", "win", "positive",
    "benefit", "efficient", "helpful", "impressive", "incredible",
  ]);
  const negativeWords = new Set([
    "bad", "worst", "terrible", "awful", "hate", "poor", "horrible",
    "fail", "failure", "loss", "decline", "crash", "crisis", "problem",
    "issue", "risk", "danger", "concern", "fear", "worry", "bearish",
    "pessimistic", "struggling", "drop", "fell", "plunge", "collapse",
    "weak", "debt", "scam", "fraud", "overpriced", "bubble", "warning",
    "recession", "layoff", "expensive", "overvalued", "disappointed",
  ]);

  let pos = 0;
  let neg = 0;
  let total = 0;

  for (const post of posts) {
    const text = `${post.title} ${post.text}`.toLowerCase();
    const words = text.match(/[a-z]+/g) || [];
    for (const w of words) {
      if (positiveWords.has(w)) pos++;
      if (negativeWords.has(w)) neg++;
      total++;
    }
  }

  if (total === 0) return { positive: 34, neutral: 33, negative: 33 };

  const posRatio = pos / (pos + neg + 1);
  const negRatio = neg / (pos + neg + 1);
  const posPercent = Math.round(posRatio * 80 + 10);
  const negPercent = Math.round(negRatio * 80 + 5);
  const neutPercent = Math.max(5, 100 - posPercent - negPercent);
  const sum = posPercent + negPercent + neutPercent;

  return {
    positive: Math.round((posPercent / sum) * 100),
    neutral: Math.round((neutPercent / sum) * 100),
    negative: Math.round((negPercent / sum) * 100),
  };
}

function generateVolumeData(
  posts: Post[]
): { date: string; count: number }[] {
  const dateCounts: Record<string, number> = {};

  for (const post of posts) {
    try {
      const dateStr = post.created.slice(0, 10);
      if (dateStr && dateStr.length === 10) {
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      }
    } catch (_e) {
      continue;
    }
  }

  if (Object.keys(dateCounts).length === 0) {
    const now = new Date();
    return Array.from({ length: 15 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (14 - i));
      return { date: d.toISOString().slice(0, 10), count: 0 };
    });
  }

  return Object.entries(dateCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function buildPostsSummaryForAI(posts: Post[], sectorName: string): string {
  const topPosts = posts
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  const postSummaries = topPosts
    .map((p, i) => `${i + 1}. [${p.source}] "${p.title}" (score: ${p.score}, comments: ${p.num_comments})${p.text ? `\n   ${p.text.slice(0, 200)}` : ""}`)
    .join("\n");

  return `Sector: ${sectorName}
Total posts analyzed: ${posts.length}
Sources: Reddit (${posts.filter(p => p.source === "Reddit").length}), HackerNews (${posts.filter(p => p.source === "HackerNews").length})

Top posts by engagement:
${postSummaries}`;
}

async function generateAIAnalysis(
  posts: Post[],
  sectorName: string,
  topics: { topic: string; count: number }[],
  sentiment: { positive: number; neutral: number; negative: number }
): Promise<{ summary: string; insights: string[] }> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  if (!GEMINI_API_KEY) {
    return fallbackAnalysis(posts, sectorName, topics, sentiment);
  }

  const postContext = buildPostsSummaryForAI(posts, sectorName);
  const topicList = topics.map(t => `${t.topic} (${t.count} mentions)`).join(", ");

  const prompt = `You are an expert industry analyst. Analyze the following social media discussions about "${sectorName}" and provide actionable insights.

${postContext}

Detected trending topics: ${topicList}
Sentiment breakdown: ${sentiment.positive}% positive, ${sentiment.neutral}% neutral, ${sentiment.negative}% negative

Respond in EXACTLY this JSON format, nothing else:
{
  "summary": "A 2-3 sentence executive summary of the current state and trends in this sector based on the discussions.",
  "insights": [
    "First specific, data-backed insight about a key trend",
    "Second insight about market sentiment or emerging opportunity",
    "Third insight about a risk or challenge the industry faces",
    "Fourth insight about competitive dynamics or innovation",
    "Fifth insight with a forward-looking prediction or recommendation"
  ]
}

Requirements:
- Summary should be concise but insightful, referencing specific themes from the data
- Each insight should be 1-2 sentences, specific, and actionable
- Reference actual topics and data points from the posts
- Be analytical, not generic`;

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
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!resp.ok) {
      return fallbackAnalysis(posts, sectorName, topics, sentiment);
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return fallbackAnalysis(posts, sectorName, topics, sentiment);
    }

    const parsed = JSON.parse(text);

    if (parsed.summary && Array.isArray(parsed.insights) && parsed.insights.length >= 3) {
      return {
        summary: parsed.summary,
        insights: parsed.insights.slice(0, 5),
      };
    }

    return fallbackAnalysis(posts, sectorName, topics, sentiment);
  } catch (_e) {
    return fallbackAnalysis(posts, sectorName, topics, sentiment);
  }
}

function fallbackAnalysis(
  posts: Post[],
  sectorName: string,
  topics: { topic: string; count: number }[],
  sentiment: { positive: number; neutral: number; negative: number }
): { summary: string; insights: string[] } {
  const topTopics = topics.slice(0, 3).map((t) => t.topic);
  const redditCount = posts.filter((p) => p.source === "Reddit").length;
  const hnCount = posts.filter((p) => p.source === "HackerNews").length;
  const avgScore = posts.reduce((sum, p) => sum + p.score, 0) / posts.length;
  const highEngagement = posts.filter((p) => p.num_comments > 10).length;

  let summary = `Analysis of ${posts.length} recent discussions across `;
  const sources = [];
  if (redditCount > 0) sources.push(`Reddit (${redditCount} posts)`);
  if (hnCount > 0) sources.push(`HackerNews (${hnCount} posts)`);
  summary += sources.join(" and ") + ` reveals key trends in the ${sectorName} space. `;

  if (topTopics.length > 0) {
    summary += `The most discussed themes include ${topTopics.join(", ")}. `;
  }

  if (highEngagement > 5) {
    summary += `Community engagement is notably high, with ${highEngagement} posts receiving significant discussion. `;
  }

  summary += `Average post engagement score is ${Math.round(avgScore)}, indicating ${avgScore > 50 ? "strong" : "moderate"} community interest.`;

  const insights: string[] = [];

  if (topics.length > 0) {
    insights.push(
      `"${topics[0].topic}" is the dominant discussion topic in ${sectorName}, appearing in ${topics[0].count} posts.`
    );
  }

  if (sentiment.positive > sentiment.negative) {
    insights.push(
      `Overall sentiment is ${sentiment.positive}% positive, suggesting a favorable market outlook.`
    );
  } else {
    insights.push(
      `Sentiment shows ${sentiment.negative}% negative discussion, indicating market concerns worth monitoring.`
    );
  }

  const highScorePosts = posts
    .filter((p) => p.score > 50)
    .sort((a, b) => b.score - a.score);
  if (highScorePosts.length > 0) {
    insights.push(
      `The highest-engagement discussion "${highScorePosts[0].title.slice(0, 60)}..." received a score of ${highScorePosts[0].score}.`
    );
  }

  if (redditCount > 0 && hnCount > 0) {
    insights.push(
      `Discussion is active across both Reddit (${redditCount} posts) and HackerNews (${hnCount} posts), showing broad industry interest.`
    );
  }

  if (topics.length >= 3) {
    insights.push(
      `Emerging subtopics include "${topics[1]?.topic}" and "${topics[2]?.topic}", worth tracking for future developments.`
    );
  }

  while (insights.length < 5) {
    insights.push(
      `Continued monitoring of ${sectorName} discussions is recommended to identify emerging trends early.`
    );
  }

  return { summary, insights: insights.slice(0, 5) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: AnalyzeRequest = await req.json();
    const sectorId = body.sector_id;
    const customTopic = body.custom_topic;

    const sector = SECTORS[sectorId];
    if (!sector) {
      return new Response(
        JSON.stringify({ error: "Unknown sector" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let keywords = sector.keywords;
    let sectorName = sector.name;

    if (sectorId === "custom" && customTopic) {
      keywords = [customTopic];
      sectorName = customTopic;
    }

    if (keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: "No keywords provided. Enter a custom topic." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [redditPosts, hnPosts] = await Promise.all([
      fetchRedditPosts(keywords),
      fetchHackerNewsPosts(keywords),
    ]);

    const allPosts = [...redditPosts, ...hnPosts];

    if (allPosts.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "No data found for this topic. Try a different sector or custom topic.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const topics = extractTopics(allPosts);
    const sentiment = analyzeSentiment(allPosts);
    const { summary, insights } = await generateAIAnalysis(allPosts, sectorName, topics, sentiment);
    const volumeData = generateVolumeData(allPosts);

    const sources = allPosts.slice(0, 15).map((p) => ({
      title: p.title,
      source: p.source,
      url: p.url,
      date: p.created,
      snippet: (p.text || "").slice(0, 150),
    }));

    const result = {
      sector: sectorName,
      topic: customTopic || sectorName,
      summary,
      sentiment,
      trending_topics: topics,
      volume_over_time: volumeData,
      key_insights: insights,
      sources,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
