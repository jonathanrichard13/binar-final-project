# Unanswered Queries Endpoint

The `/api/analytics/unanswered` endpoint helps identify gaps in your FAQ content by listing queries that received no answers.

## Usage Examples

### Basic Usage

```bash
GET /api/analytics/unanswered
```

### With Parameters

```bash
# Get unanswered queries from last 7 days, grouped by similarity
GET /api/analytics/unanswered?timeRange=7d&groupSimilar=true&page=1&limit=20

# Get individual unanswered queries from last 24 hours
GET /api/analytics/unanswered?timeRange=24h&groupSimilar=false&page=1&limit=50
```

## Response Structure

```json
{
  "unansweredQueries": [
    {
      "id": 123,
      "query_text": "How do I cancel my subscription?",
      "frequency": 5,
      "latest_timestamp": "2025-07-19T14:00:00.000Z",
      "first_timestamp": "2025-07-18T09:30:00.000Z",
      "avg_processing_time": 234.5,
      "session_ids": ["session_001", "session_042", "session_089"]
    }
  ],
  "summary": {
    "totalUnanswered": 156,
    "uniqueQueries": 89,
    "topKeywords": [
      { "word": "cancel", "frequency": 15 },
      { "word": "refund", "frequency": 12 },
      { "word": "subscription", "frequency": 10 }
    ],
    "timeDistribution": [
      { "date": "2025-07-19", "unanswered_count": 23 },
      { "date": "2025-07-18", "unanswered_count": 31 }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 89,
    "totalPages": 5
  },
  "groupSimilar": true
}
```

## Parameters

- **timeRange**: `1h`, `24h`, `7d`, `30d`, `90d`, `1y` (default: `7d`)
- **page**: Page number for pagination (default: `1`)
- **limit**: Results per page (default: `50`)
- **groupSimilar**: Group similar queries and show frequency (default: `false`)

## Use Cases

1. **Content Gap Analysis**: Identify what FAQ content is missing
2. **Popular Unanswered Topics**: See which topics users ask about most
3. **Trending Issues**: Monitor new types of questions over time
4. **FAQ Improvement**: Prioritize which FAQ content to create next

## Integration with Your FAQ System

Use this endpoint to:

- Generate reports of content gaps
- Create alerts when certain types of questions spike
- Feed data into content creation workflows
- Track improvement in coverage over time
