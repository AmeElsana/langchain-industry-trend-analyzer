import json
import re
from datetime import datetime, timedelta
from collections import Counter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from .sectors import SECTORS, get_sector_by_id
from .fetchers import fetch_all_data
from .chains import (
    get_summary_chain,
    get_sentiment_chain,
    get_insights_chain,
    get_topics_chain,
    get_report_chain,
    get_chat_chain,
)

app = FastAPI(title="EnQue API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for fetched data
_data_cache: dict[str, dict] = {}


class AnalyzeRequest(BaseModel):
    sector_id: str
    custom_topic: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    sector_id: str


def _prepare_posts_text(posts: list[dict], max_chars: int = 4000) -> str:
    """Concatenate post titles and text for LLM input."""
    texts = []
    total = 0
    for p in posts:
        entry = f"- {p['title']}"
        if p.get("text"):
            entry += f": {p['text'][:200]}"
        if total + len(entry) > max_chars:
            break
        texts.append(entry)
        total += len(entry)
    return "\n".join(texts)


def _parse_json_safe(text: str, fallback):
    """Try to extract and parse JSON from LLM output."""
    try:
        match = re.search(r'[\[{].*[\]}]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except (json.JSONDecodeError, AttributeError):
        pass
    return fallback


def _generate_volume_data(posts: list[dict]) -> list[dict]:
    """Generate volume-over-time data from post timestamps."""
    date_counts: Counter = Counter()
    for p in posts:
        try:
            dt = datetime.fromisoformat(p.get("created", "")[:10])
            date_counts[dt.strftime("%Y-%m-%d")] += 1
        except (ValueError, TypeError):
            continue

    if not date_counts:
        base = datetime.now()
        return [{"date": (base - timedelta(days=i)).strftime("%Y-%m-%d"), "count": 0} for i in range(14, -1, -1)]

    sorted_dates = sorted(date_counts.items())
    return [{"date": d, "count": c} for d, c in sorted_dates]


async def _get_data_for_sector(sector_id: str, custom_topic: Optional[str] = None) -> tuple[list[dict], dict]:
    """Fetch and cache data for a sector."""
    cache_key = f"{sector_id}:{custom_topic or ''}"
    if cache_key in _data_cache:
        cached = _data_cache[cache_key]
        if (datetime.now() - cached["fetched_at"]).seconds < 600:
            return cached["posts"], cached["sector"]

    sector = get_sector_by_id(sector_id)
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")

    keywords = sector["keywords"]
    subreddits = sector["subreddits"]

    if sector_id == "custom" and custom_topic:
        keywords = [custom_topic]
        subreddits = []
        sector = {**sector, "name": custom_topic}

    if not keywords:
        raise HTTPException(status_code=400, detail="No keywords to search. Provide a custom topic.")

    posts = await fetch_all_data(keywords, subreddits)
    if not posts:
        raise HTTPException(status_code=404, detail="No data found. Try a different topic or check your internet connection.")

    _data_cache[cache_key] = {"posts": posts, "sector": sector, "fetched_at": datetime.now()}
    return posts, sector


@app.get("/api/sectors")
async def get_sectors():
    return [{k: v for k, v in s.items() if k not in ("subreddits", "hn_tags")} for s in SECTORS]


@app.post("/api/analyze")
async def analyze_trends(req: AnalyzeRequest):
    posts, sector = await _get_data_for_sector(req.sector_id, req.custom_topic)
    posts_text = _prepare_posts_text(posts)
    sector_name = sector["name"]

    summary_chain = get_summary_chain()
    sentiment_chain = get_sentiment_chain()
    insights_chain = get_insights_chain()
    topics_chain = get_topics_chain()

    summary_result = await summary_chain.ainvoke({"sector": sector_name, "posts_text": posts_text})
    sentiment_result = await sentiment_chain.ainvoke({"posts_text": posts_text})
    insights_result = await insights_chain.ainvoke({"sector": sector_name, "posts_text": posts_text})
    topics_result = await topics_chain.ainvoke({"posts_text": posts_text})

    summary = summary_result.get("text", "").strip()
    sentiment = _parse_json_safe(sentiment_result.get("text", ""), {"positive": 40, "neutral": 40, "negative": 20})
    insights = _parse_json_safe(insights_result.get("text", ""), ["No insights generated"])
    topics = _parse_json_safe(topics_result.get("text", ""), [{"topic": "General", "count": 10, "sentiment": 0.0}])

    sources = [
        {
            "title": p["title"],
            "source": p.get("source", "Unknown"),
            "url": p.get("url", ""),
            "date": p.get("created", ""),
            "snippet": (p.get("text", "") or "")[:150],
        }
        for p in posts[:15]
    ]

    return {
        "sector": sector_name,
        "topic": req.custom_topic or sector_name,
        "summary": summary,
        "sentiment": sentiment,
        "trending_topics": topics,
        "volume_over_time": _generate_volume_data(posts),
        "key_insights": insights,
        "sources": sources,
    }


@app.post("/api/report")
async def generate_report(req: AnalyzeRequest):
    posts, sector = await _get_data_for_sector(req.sector_id, req.custom_topic)
    posts_text = _prepare_posts_text(posts)
    sector_name = sector["name"]

    summary_chain = get_summary_chain()
    sentiment_chain = get_sentiment_chain()
    insights_chain = get_insights_chain()
    topics_chain = get_topics_chain()

    summary_result = await summary_chain.ainvoke({"sector": sector_name, "posts_text": posts_text})
    sentiment_result = await sentiment_chain.ainvoke({"posts_text": posts_text})
    insights_result = await insights_chain.ainvoke({"sector": sector_name, "posts_text": posts_text})
    topics_result = await topics_chain.ainvoke({"posts_text": posts_text})

    summary = summary_result.get("text", "").strip()
    sentiment = sentiment_result.get("text", "").strip()
    insights = insights_result.get("text", "").strip()
    topics = topics_result.get("text", "").strip()

    report_chain = get_report_chain()
    report_result = await report_chain.ainvoke({
        "sector": sector_name,
        "summary": summary,
        "sentiment": sentiment,
        "insights": insights,
        "topics": topics,
    })

    report_data = _parse_json_safe(
        report_result.get("text", ""),
        {
            "executive_summary": summary,
            "sections": [{"heading": "Overview", "content": summary}],
            "recommendations": ["Further research needed"],
        }
    )

    return {
        "title": f"{sector_name} Market Insights Report",
        "generated_at": datetime.now().isoformat(),
        "sector": sector_name,
        **report_data,
    }


@app.post("/api/chat")
async def chat_with_agent(req: ChatRequest):
    posts, sector = await _get_data_for_sector(req.sector_id)
    posts_text = _prepare_posts_text(posts, max_chars=2000)
    sector_name = sector["name"]

    chat_chain = get_chat_chain()
    result = await chat_chain.ainvoke({
        "sector": sector_name,
        "context": posts_text,
        "question": req.message,
    })

    return {"response": result.get("text", "").strip()}
