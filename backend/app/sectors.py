SECTORS = [
    {
        "id": "corporate_travel",
        "name": "Corporate Travel & Expense",
        "description": "Travel management, expense reporting, corporate booking, and T&E automation",
        "icon": "briefcase",
        "keywords": [
            "corporate travel", "expense management", "travel booking",
            "expense reporting", "business travel", "T&E", "SAP Concur",
            "travel automation", "corporate card", "receipt management"
        ],
        "subreddits": ["business", "travel", "smallbusiness", "accounting"],
        "hn_tags": ["corporate travel", "expense management", "business travel"],
    },
    {
        "id": "asset_management",
        "name": "Asset Management & Finance",
        "description": "Investment management, portfolio analysis, fintech, and wealth management",
        "icon": "dollar-sign",
        "keywords": [
            "asset management", "portfolio management", "investment",
            "wealth management", "fintech", "robo advisor", "hedge fund",
            "ETF", "mutual fund", "financial planning"
        ],
        "subreddits": ["investing", "finance", "FinancialPlanning", "stocks"],
        "hn_tags": ["fintech", "investment", "asset management"],
    },
    {
        "id": "healthcare",
        "name": "Healthcare & Wellness",
        "description": "Digital health, telemedicine, health tech, wellness platforms, and patient care",
        "icon": "heart",
        "keywords": [
            "digital health", "telemedicine", "health tech", "wellness",
            "patient care", "EHR", "health data", "mental health",
            "remote patient monitoring", "healthcare AI"
        ],
        "subreddits": ["healthcare", "HealthIT", "digitalhealth", "medicine"],
        "hn_tags": ["healthcare", "digital health", "telemedicine"],
    },
    {
        "id": "enterprise_saas",
        "name": "Enterprise SaaS & Technology",
        "description": "Cloud computing, enterprise software, SaaS platforms, and digital transformation",
        "icon": "cpu",
        "keywords": [
            "enterprise software", "SaaS", "cloud computing", "digital transformation",
            "ERP", "CRM", "enterprise AI", "low code", "no code",
            "platform engineering", "DevOps"
        ],
        "subreddits": ["SaaS", "cloud", "devops", "programming"],
        "hn_tags": ["SaaS", "enterprise", "cloud computing"],
    },
    {
        "id": "sustainability",
        "name": "Sustainability & ESG",
        "description": "Environmental sustainability, ESG reporting, carbon tracking, and green technology",
        "icon": "leaf",
        "keywords": [
            "sustainability", "ESG", "carbon footprint", "green technology",
            "renewable energy", "climate tech", "carbon tracking",
            "sustainable business", "circular economy", "net zero"
        ],
        "subreddits": ["sustainability", "environment", "climate", "RenewableEnergy"],
        "hn_tags": ["sustainability", "climate tech", "ESG"],
    },
    {
        "id": "custom",
        "name": "Custom Topic",
        "description": "Enter any industry or topic to analyze",
        "icon": "plus",
        "keywords": [],
        "subreddits": [],
        "hn_tags": [],
    },
]


from typing import Optional

def get_sector_by_id(sector_id: str) -> Optional[dict]:
    for sector in SECTORS:
        if sector["id"] == sector_id:
            return sector
    return None
