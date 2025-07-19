# MCP Server Structure

This directory contains the organized MCP FAQ Server with all its components.

## Directory Structure

```
mcp_server/
├── __init__.py                 # Python package initialization
├── faq_mcp_server.py          # Main MCP server file
├── faq_content_manager.py     # FAQ content management
├── claude_reasoning_engine.py # Claude reasoning logic
├── analytics_logger.py        # Analytics and logging
├── database_models.py         # Database models
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── faq/                       # FAQ content files
│   ├── account_management.txt
│   ├── billing_payments.txt
│   └── ... (other FAQ files)
├── tests/                     # Test files
│   ├── __init__.py
│   ├── test_faq_server.py
│   └── test_analytics_integration.py
└── setup/                     # Setup and installation scripts
    ├── __init__.py
    ├── setup.py
    ├── setup_database.py
    └── start_server.py
```

## Running the Server

From the Claude desktop configuration, the server is automatically started with:

- Command: `uv run --with mcp python faq_mcp_server.py`
- Working directory: `mcp_server/`

## Manual Testing

To run tests manually:

```bash
cd mcp_server/tests
python test_faq_server.py
python test_analytics_integration.py
```

## Database Setup

To set up the database:

```bash
cd mcp_server/setup
python setup_database.py
```

## Manual Server Start

To start the server manually:

```bash
cd mcp_server/setup
python start_server.py
```
