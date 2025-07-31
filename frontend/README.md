# FAQ Analytics Dashboard Frontend

A React-based dashboard for monitoring and analyzing FAQ usage patterns and identifying content gaps.

## Features

- **Dashboard Overview**: Real-time metrics and key performance indicators
- **Query Analytics**: Detailed analysis of user queries and trends
- **Unanswered Queries**: Identification of content gaps and improvement opportunities
- **Real-time Updates**: Live data updates using WebSocket connections
- **Interactive Charts**: Data visualization using Chart.js
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **HTTP Client**: Axios
- **Real-time**: Socket.io client
- **Build Tool**: Create React App

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running on http://localhost:3001

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:

```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3001
```

### Development

```bash
# Start development server
npm start

# Run in development mode with hot reload
npm run dev
```

The application will be available at http://localhost:3000

### Build

```bash
# Build for production
npm run build

# Serve production build locally
npm run serve
```

## Project Structure

```
frontend/
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout.tsx      # Main layout with navigation
│   │   └── Charts.tsx      # Chart components
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Overview dashboard
│   │   ├── QueryAnalytics.tsx # Query analysis
│   │   └── UnansweredQueries.tsx # Content gaps
│   ├── utils/              # Utility functions
│   │   ├── api.ts          # API service layer
│   │   ├── analytics.ts    # Analytics utilities
│   │   └── helpers.ts      # Helper functions
│   ├── App.tsx             # Main app component
│   ├── index.tsx           # Entry point
│   └── index.css           # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## API Integration

The frontend communicates with the backend API for:

- **Analytics Data**: Query metrics, trends, and statistics
- **Unanswered Queries**: Content gap analysis
- **Real-time Updates**: Live data via WebSocket
- **Data Export**: CSV/JSON export functionality

### API Endpoints Used

- `GET /api/analytics` - Analytics data with filtering options
- `GET /api/analytics/unanswered` - Unanswered queries analysis
- `GET /api/system/metrics` - System performance metrics
- `POST /api/analytics/export` - Data export functionality
- WebSocket connection for real-time updates

## Components

### Layout

- Navigation sidebar with page routing
- Header with current page title
- Responsive mobile menu

### Dashboard

- Key metrics overview cards
- Query trends chart (Line chart)
- Top FAQ categories (Bar chart)
- Recent activity table

### Query Analytics

- Time-based filtering (today/week/month)
- Query trends over time
- Category breakdown
- Top queries analysis
- Recent queries list

### Unanswered Queries

- Keyword frequency analysis
- Coverage gap identification
- Sortable query list
- Keyword filtering
- Actionable recommendations

### Charts

- Line charts for trends
- Bar charts for categories
- Doughnut charts for distributions
- Responsive and interactive

## Configuration

### Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3001
REACT_APP_REFRESH_INTERVAL=30000
```

### Tailwind CSS

The project uses Tailwind CSS for styling with:

- Custom color palette
- Responsive design utilities
- Component-based styling
- Dark mode support (configurable)

## Real-time Features

The dashboard includes real-time updates via WebSocket:

```typescript
// Automatic connection to backend WebSocket
const socket = io(process.env.REACT_APP_WS_URL);

// Listen for analytics updates
socket.on('analytics:update', (data) => {
  // Update dashboard data
});
```

## Data Visualization

Charts are implemented using Chart.js with:

- Responsive design
- Interactive tooltips
- Customizable themes
- Multiple chart types

## Error Handling

- API error boundaries
- Loading states for all data fetching
- User-friendly error messages
- Retry mechanisms for failed requests

## Performance Optimization

- Lazy loading of components
- Memoized expensive calculations
- Debounced search inputs
- Efficient re-rendering with React.memo

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement proper error handling
4. Add loading states for async operations
5. Ensure responsive design
6. Write meaningful commit messages

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend server is running
   - Check CORS configuration
   - Validate environment variables

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS classes
   - Verify PostCSS configuration
