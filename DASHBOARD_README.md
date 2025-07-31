# FAQ Analytics Dashboard

A comprehensive web-based analytics dashboard for monitoring and analyzing FAQ usage patterns, query performance, and identifying content gaps in your FAQ system.

![Dashboard Overview](./images/Dashboard%20Overview.png)

## Overview

The FAQ Analytics Dashboard provides real-time insights into how users interact with your FAQ system, helping you optimize content and improve user experience. Built with React and TypeScript, it offers intuitive data visualization and actionable insights.

## Features

### 📊 **Dashboard Overview**

- **Real-time metrics**: Total queries, success rate, average response time
- **Query volume trends**: Visual representation of usage patterns over time
- **Top FAQ files**: Most frequently accessed content
- **Recent activity**: Latest query interactions
- **Performance indicators**: System health and response metrics

### 🔍 **Query Analytics**

![Query Analytics](./images/Query%20Analytics.png)

- **Comprehensive query analysis**: Pattern detection and categorization
- **Daily query trends**: Track usage patterns over time
- **Query category breakdown**: Visual distribution of query types
- **Top queries list**: Most frequent user questions
- **Success rate analysis**: Monitor answer effectiveness

### ⚡ **Performance Monitoring**

![Performance Analytics](./images/Performance%20Analytics.png)

- **Response time percentiles**: P50, P95, P99 performance metrics
- **Error rate tracking**: Monitor system reliability
- **System health monitoring**: Real-time CPU, memory, and disk usage
- **Database performance**: Query latency and optimization insights
- **Uptime tracking**: System availability monitoring

### ❓ **Unanswered Queries Analysis**

![Unanswered Queries](./images/Unanswered%20Queries.png)

- **Content gap identification**: Discover missing FAQ content
- **Keyword frequency analysis**: Common terms in unanswered queries
- **Query grouping**: Identify similar unanswered questions
- **Coverage gap recommendations**: Actionable insights for content improvement
- **Trending unanswered topics**: Emerging user needs

## Technology Stack

### Frontend

- **React 18+** with TypeScript for robust component development
- **Next.js** for server-side rendering and routing
- **Tailwind CSS** for responsive, modern UI design
- **Chart.js** with react-chartjs-2 for interactive data visualization
- **Axios** for API communication
- **Socket.io** for real-time updates

### Backend

- **Express.js** with TypeScript for API development
- **PostgreSQL** for robust data storage and analytics
- **Socket.io** for real-time communication
- **Winston** for comprehensive logging
- **Swagger/OpenAPI** for API documentation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd faq-analytics-dashboard
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://username:password@localhost:5432/faq_analytics
   PORT=3001

   # Frontend (.env)
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_WS_URL=http://localhost:3001
   ```

4. **Database Setup**

   ```bash
   # The application will automatically create required tables
   cd backend
   npm run dev
   ```

5. **Start the Application**

   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

6. **Access the Dashboard**
   - Dashboard: http://localhost:3000
   - API Documentation: http://localhost:3001/api-docs

## Key Features in Detail

### Interactive Data Visualization

- **Responsive charts** that adapt to different screen sizes
- **Hover tooltips** with detailed information
- **Time range filtering** (24h, 7d, 30d, 90d, 1y)
- **Drill-down capability** from overview to detailed data

### Performance Monitoring

- **System health dashboard** with real-time metrics
- **Database performance tracking**
- **Error rate monitoring** with alert thresholds
- **Response time analysis** with percentile breakdowns

### Content Gap Analysis

- **Automated unanswered query detection**
- **Keyword frequency analysis** for content planning
- **Similar query grouping** to identify patterns
- **Actionable recommendations** for FAQ improvements

## API Endpoints

The dashboard integrates with these main API endpoints:

- `GET /api/analytics/overview` - Dashboard overview metrics
- `GET /api/analytics/queries` - Detailed query analytics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/unanswered` - Content gap analysis
- `GET /api/system/health` - Real-time system health
- `GET /api/export/data` - Data export functionality

## Integration with MCP Server

The dashboard seamlessly integrates with the FAQ MCP Server to:

- **Track query interactions** automatically
- **Monitor performance** of FAQ responses
- **Identify content gaps** in your FAQ files
- **Provide insights** for content optimization

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Architecture

The dashboard follows a modern web application architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  Express Backend │◄──►│   PostgreSQL    │
│   (Port 3000)   │    │   (Port 3001)    │    │    Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Contributing

1. Follow TypeScript best practices
2. Use functional components with React hooks
3. Implement proper error handling
4. Add loading states for async operations
5. Ensure responsive design
6. Write meaningful commit messages

## Troubleshooting

### Common Issues

1. **API Connection Errors**

   - Verify backend server is running on port 3001
   - Check CORS configuration
   - Validate environment variables

2. **Database Connection Issues**

   - Ensure PostgreSQL is running
   - Verify database credentials
   - Check database exists and is accessible

3. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript configuration
   - Verify all dependencies are correctly installed

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review API documentation at http://localhost:3001/api-docs
3. Check backend logs for error details
4. Verify database connectivity and schema

---

**Built with ❤️ for better FAQ analytics and user experience optimization**
