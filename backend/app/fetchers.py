import httpx
import os
from datetime import datetime, timedelta
from typing import List


async def fetch_reddit_posts(keywords: List[str], subreddits: List[str], limit: int = 50) -> List[dict]:
    """Fetch posts from Reddit using the public JSON API (no auth required)."""
    posts = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        search_query = " OR ".join(keywords[:5])
        try:
            url = f"https://www.reddit.com/search.json?q={search_query}&sort=relevance&t=month&limit={limit}"
            headers = {"User-Agent": "TrendLens/1.0"}
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for child in data.get("data", {}).get("children", []):
                    post = child.get("data", {})
                    posts.append({
                        "title": post.get("title", ""),
                        "text": post.get("selftext", "")[:500],
                        "score": post.get("score", 0),
                        "num_comments": post.get("num_comments", 0),
                        "url": f"https://reddit.com{post.get('permalink', '')}",
                        "created": datetime.fromtimestamp(post.get("created_utc", 0)).isoformat(),
                        "subreddit": post.get("subreddit", ""),
                        "source": "Reddit",
                    })
        except Exception as e:
            print(f"Reddit fetch error: {e}")
    return posts


async def fetch_hackernews_posts(keywords: List[str], limit: int = 30) -> List[dict]:
    """Fetch posts from HackerNews using the Algolia search API."""
    posts = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        search_query = " ".join(keywords[:3])
        try:
            url = f"https://hn.algolia.com/api/v1/search?query={search_query}&tags=story&hitsPerPage={limit}"
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                for hit in data.get("hits", []):
                    posts.append({
                        "title": hit.get("title", ""),
                        "text": hit.get("story_text", "") or "",
                        "score": hit.get("points", 0),
                        "num_comments": hit.get("num_comments", 0),
                        "url": hit.get("url", "") or f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
                        "created": hit.get("created_at", ""),
                        "source": "HackerNews",
                    })
        except Exception as e:
            print(f"HackerNews fetch error: {e}")
    return posts


async def fetch_news_articles(keywords: List[str], limit: int = 20) -> List[dict]:
    """Fetch news articles from NewsAPI if key is available, otherwise return empty."""
    articles = []
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        return articles

    async with httpx.AsyncClient(timeout=15.0) as client:
        search_query = " OR ".join(keywords[:3])
        from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        try:
            url = f"https://newsapi.org/v2/everything?q={search_query}&from={from_date}&sortBy=relevancy&pageSize={limit}&apiKey={api_key}"
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                for article in data.get("articles", []):
                    articles.append({
                        "title": article.get("title", ""),
                        "text": article.get("description", "") or "",
                        "url": article.get("url", ""),
                        "created": article.get("publishedAt", ""),
                        "source": f"News - {article.get('source', {}).get('name', 'Unknown')}",
                    })
        except Exception as e:
            print(f"NewsAPI fetch error: {e}")
    return articles


async def fetch_all_data(keywords: List[str], subreddits: List[str]) -> List[dict]:
    """Fetch data from all available sources."""
    reddit_posts = await fetch_reddit_posts(keywords, subreddits)
    hn_posts = await fetch_hackernews_posts(keywords)
    news_articles = await fetch_news_articles(keywords)
    return reddit_posts + hn_posts + news_articles
