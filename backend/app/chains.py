import os
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_huggingface import HuggingFaceEndpoint


def get_llm():
    """Get the LLM instance - HuggingFace by default, OpenAI as fallback."""
    hf_token = os.getenv("HUGGINGFACE_API_TOKEN")
    if hf_token:
        return HuggingFaceEndpoint(
            repo_id="mistralai/Mistral-7B-Instruct-v0.3",
            huggingfacehub_api_token=hf_token,
            max_new_tokens=1024,
            temperature=0.7,
        )

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        from langchain_community.llms import OpenAI
        return OpenAI(api_key=openai_key, temperature=0.7, max_tokens=1024)

    raise ValueError("No API token found. Set HUGGINGFACE_API_TOKEN or OPENAI_API_KEY in .env")


# --- Trend Summarization Chain ---
TREND_SUMMARY_PROMPT = PromptTemplate(
    input_variables=["sector", "posts_text"],
    template="""You are a market research analyst. Analyze the following online discussions about the {sector} sector.

DATA:
{posts_text}

Provide a concise 3-4 sentence summary of the major trends and themes you observe in these discussions. Focus on what people are talking about most, any emerging concerns, and notable shifts in sentiment."""
)


# --- Sentiment Analysis Chain ---
SENTIMENT_PROMPT = PromptTemplate(
    input_variables=["posts_text"],
    template="""Analyze the sentiment of these online discussions and return ONLY a JSON object with three percentage values that sum to 100.

DATA:
{posts_text}

Return ONLY valid JSON in this exact format, no other text:
{{"positive": 45, "neutral": 35, "negative": 20}}"""
)


# --- Key Insights Chain ---
INSIGHTS_PROMPT = PromptTemplate(
    input_variables=["sector", "posts_text"],
    template="""You are a market research analyst studying the {sector} sector. Based on these online discussions:

DATA:
{posts_text}

List exactly 5 key insights as a JSON array of strings. Each insight should be one clear, actionable sentence.
Return ONLY valid JSON array, no other text:
["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"]"""
)


# --- Trending Topics Chain ---
TOPICS_PROMPT = PromptTemplate(
    input_variables=["posts_text"],
    template="""Extract the top trending topics from these online discussions.

DATA:
{posts_text}

Return ONLY a valid JSON array of objects with "topic" (string), "count" (estimated mention count as integer), and "sentiment" (float from -1 to 1). List 7 topics max.
Example: [{{"topic": "AI automation", "count": 15, "sentiment": 0.6}}]"""
)


# --- Report Generation Chain ---
REPORT_PROMPT = PromptTemplate(
    input_variables=["sector", "summary", "sentiment", "insights", "topics"],
    template="""You are a senior market research analyst. Generate a professional insight report for the {sector} sector.

ANALYSIS DATA:
Summary: {summary}
Sentiment: {sentiment}
Key Insights: {insights}
Trending Topics: {topics}

Generate a JSON report with this exact structure:
{{
  "executive_summary": "2-3 paragraph executive summary",
  "sections": [
    {{"heading": "Market Overview", "content": "detailed paragraph"}},
    {{"heading": "Sentiment Analysis", "content": "detailed paragraph"}},
    {{"heading": "Emerging Trends", "content": "detailed paragraph"}},
    {{"heading": "Competitive Landscape", "content": "detailed paragraph"}}
  ],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"]
}}

Return ONLY valid JSON, no other text."""
)


# --- Chat Agent Chain ---
CHAT_PROMPT = PromptTemplate(
    input_variables=["sector", "context", "question"],
    template="""You are TrendLens AI, a market research assistant specializing in the {sector} sector. You have access to recent online discussions and data about this sector.

CONTEXT FROM RECENT DATA:
{context}

USER QUESTION: {question}

Provide a helpful, data-informed response. Reference specific trends or data points from the context when relevant. Keep your response concise and actionable."""
)


def create_chain(prompt: PromptTemplate) -> LLMChain:
    """Create a LangChain chain with the configured LLM."""
    llm = get_llm()
    return LLMChain(llm=llm, prompt=prompt)


def get_summary_chain() -> LLMChain:
    return create_chain(TREND_SUMMARY_PROMPT)


def get_sentiment_chain() -> LLMChain:
    return create_chain(SENTIMENT_PROMPT)


def get_insights_chain() -> LLMChain:
    return create_chain(INSIGHTS_PROMPT)


def get_topics_chain() -> LLMChain:
    return create_chain(TOPICS_PROMPT)


def get_report_chain() -> LLMChain:
    return create_chain(REPORT_PROMPT)


def get_chat_chain() -> LLMChain:
    return create_chain(CHAT_PROMPT)
