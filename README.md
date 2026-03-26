# EnQur — AI-Powered Industry Trend Analyzer

A full-stack application that pulls real public data from Reddit, HackerNews, and news sources, then uses **LangChain + HuggingFace** to identify trends, analyze sentiment, and generate insight reports across multiple industry sectors.

## Sectors Covered

- **Corporate Travel & Expense** — SAP Concur's domain
- **Asset Management & Finance** — Investment, fintech, wealth management
- **Healthcare & Wellness** — Digital health, telemedicine, health tech
- **Enterprise SaaS & Technology** — Cloud, ERP, digital transformation
- **Sustainability & ESG** — Climate tech, carbon tracking, green tech
- **Custom** — Enter any topic or industry

## Features

| Feature | Description |
|---------|-------------|
| **Trend Analysis** | Interactive charts (sentiment, volume, topics) from real online discussions |
| **AI Insights Agent** | Chat with a LangChain-powered agent about market trends |
| **Report Generator** | Auto-generate stakeholder-ready reports with executive summaries |
| **Multi-Sector** | Switch between 5 pre-configured sectors or enter any custom topic |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, TailwindCSS, Recharts, Lucide Icons |
| Backend | Python, FastAPI, LangChain, HuggingFace Inference API |
| Data Sources | Reddit (public JSON API), HackerNews (Algolia API), NewsAPI (optional) |
| AI/ML | LangChain chains for summarization, sentiment analysis, trend extraction, report generation |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A HuggingFace API token (free at https://huggingface.co/settings/tokens)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your HUGGINGFACE_API_TOKEN
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:8000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HUGGINGFACE_API_TOKEN` | Yes* | HuggingFace Inference API token |
| `OPENAI_API_KEY` | No | Alternative to HuggingFace |
| `NEWS_API_KEY` | No | Enables news article fetching |
| `REDDIT_CLIENT_ID` | No | For authenticated Reddit access |

*Either `HUGGINGFACE_API_TOKEN` or `OPENAI_API_KEY` is required.

## Project Structure

```
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── components/     # Sidebar, SectorSelector
│       ├── pages/          # Dashboard, TrendAnalysis, AIInsights, Reports
│       ├── api.ts          # API client
│       └── types.ts        # TypeScript interfaces
├── backend/                # Python FastAPI backend
│   └── app/
│       ├── main.py         # FastAPI routes & orchestration
│       ├── chains.py       # LangChain prompts & chains
│       ├── fetchers.py     # Data fetchers (Reddit, HN, News)
│       └── sectors.py      # Sector configuration
└── README.md
```
