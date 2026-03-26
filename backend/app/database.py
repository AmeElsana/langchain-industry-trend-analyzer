import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create Supabase client singleton."""
    global _supabase_client

    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")

        _supabase_client = create_client(url, key)

    return _supabase_client


async def store_analysis_result(
    sector: str,
    keywords: list,
    summary: str,
    sentiment: str,
    insights: list,
    trending_topics: list,
    data_sources: dict,
    total_posts: int
) -> str:
    """Store analysis result in database and return the ID."""
    supabase = get_supabase()

    result = supabase.table("analysis_results").insert({
        "sector": sector,
        "keywords": keywords,
        "summary": summary,
        "sentiment": sentiment,
        "insights": insights,
        "trending_topics": trending_topics,
        "data_sources": data_sources,
        "total_posts": total_posts
    }).execute()

    return result.data[0]["id"]


async def store_raw_posts(analysis_id: str, posts: list) -> None:
    """Store raw posts linked to an analysis."""
    supabase = get_supabase()

    formatted_posts = [
        {
            "analysis_id": analysis_id,
            "source": post.get("source", "Unknown"),
            "title": post.get("title", ""),
            "content": post.get("text", ""),
            "url": post.get("url", ""),
            "score": post.get("score", 0),
            "num_comments": post.get("num_comments", 0),
            "published_at": post.get("created", None)
        }
        for post in posts
    ]

    if formatted_posts:
        supabase.table("raw_posts").insert(formatted_posts).execute()


async def get_cached_analysis(sector: str) -> Optional[dict]:
    """Get cached analysis result if available and not expired."""
    supabase = get_supabase()

    result = supabase.table("analysis_results")\
        .select("*")\
        .eq("sector", sector)\
        .gt("expires_at", "now()")\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if result.data:
        return result.data[0]
    return None


async def store_chat_message(analysis_id: str, role: str, content: str) -> None:
    """Store or update chat session with new message."""
    supabase = get_supabase()

    session = supabase.table("chat_sessions")\
        .select("*")\
        .eq("analysis_id", analysis_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    new_message = {"role": role, "content": content}

    if session.data:
        session_id = session.data[0]["id"]
        messages = session.data[0]["messages"]
        messages.append(new_message)

        supabase.table("chat_sessions")\
            .update({"messages": messages, "updated_at": "now()"})\
            .eq("id", session_id)\
            .execute()
    else:
        supabase.table("chat_sessions").insert({
            "analysis_id": analysis_id,
            "messages": [new_message]
        }).execute()


async def get_chat_history(analysis_id: str) -> list:
    """Get chat history for an analysis."""
    supabase = get_supabase()

    result = supabase.table("chat_sessions")\
        .select("messages")\
        .eq("analysis_id", analysis_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if result.data:
        return result.data[0]["messages"]
    return []
