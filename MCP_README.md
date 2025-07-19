# FAQ Model Context Protocol (MCP) Server

An intelligent FAQ answering system that integrates with Claude Desktop using the Model Context Protocol (MCP). The system uses Claude's chain-of-thoughts reasoning to match user queries against a knowledge base of FAQ files.

## Features

- **Chain-of-Thoughts Analysis**: Uses Claude's reasoning capabilities to match queries with FAQ content
- **Multiple FAQ Files**: Supports multiple `.txt` FAQ files organized by category
- **MCP Integration**: Native integration with Claude Desktop via Model Context Protocol
- **Real-time Processing**: Fast query processing with detailed reasoning explanations
- **File Management**: Automatic FAQ file loading and reloading capabilities

## Project Structure

```
FAQ MCP Server/
├── faq/                          # FAQ content directory
│   ├── account_management.txt    # Account-related FAQs
│   ├── billing_payments.txt      # Billing and payment FAQs
│   ├── customer_support.txt      # Support contact information
│   ├── file_management.txt       # File upload/management FAQs
│   ├── privacy_security.txt      # Privacy and security FAQs
│   ├── subscription_plans.txt    # Plan and subscription FAQs
│   ├── technical_issues.txt      # Technical troubleshooting
│   ├── mobile_app.txt           # Mobile app FAQs
│   ├── team_collaboration.txt    # Team features FAQs
│   └── integrations_api.txt      # API and integration FAQs
├── faq_content_manager.py        # FAQ file loading and parsing
├── claude_reasoning_engine.py    # Chain-of-thoughts analysis engine
├── faq_mcp_server.py             # Main MCP server implementation
├── test_faq_server.py            # Test suite
├── requirements.txt              # Python dependencies
├── mcp_config.json              # MCP server configuration
└── README.md                    # This file
```

## Installation

1. **Clone or download the project files**

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Verify FAQ content:**
   Ensure the `faq/` directory contains your FAQ files in `.txt` format with Q&A pairs.

## FAQ File Format

FAQ files should be structured with Q: and A: pairs:

```
Q: How do I create a new account?
A: To create a new account, click on the "Sign Up" button on the homepage, fill in your email address, create a secure password, and verify your email address through the confirmation link sent to your inbox.

Q: I forgot my password, how can I reset it?
A: Click on the "Forgot Password" link on the login page, enter your registered email address, and we'll send you a password reset link.
```

## Testing

Run the test suite to verify everything is working:

```bash
python test_faq_server.py
```

This will test:

- FAQ content loading and parsing
- Claude reasoning engine functionality
- End-to-end query processing

## Running the MCP Server

### For Development/Testing:

```bash
python faq_mcp_server.py
```

### For Claude Desktop Integration:

1. Configure Claude Desktop to connect to your MCP server
2. Add the server configuration to Claude Desktop's MCP settings
3. Use the server's tools through Claude Desktop interface

## Available MCP Tools

### `answer_faq`

Answers user questions based on the FAQ knowledge base.

**Parameters:**

- `query` (string): The user's question

**Response:**

```json
{
  "status": "success|no_answer|error",
  "answer": "FAQ answer content",
  "source_file": "filename.txt",
  "reasoning": "Explanation of why this FAQ was selected",
  "processing_time": 2.45
}
```

### `list_faq_files`

Lists all available FAQ files and their content summary.

**Response:**

```json
{
  "status": "success",
  "total_files": 10,
  "total_qa_pairs": 30,
  "files": [
    {
      "filename": "account_management.txt",
      "qa_count": 3,
      "category": "Account Management"
    }
  ]
}
```

### `reload_faq_content`

Reloads FAQ content from files (useful when FAQ files are updated).

**Response:**

```json
{
  "status": "success",
  "message": "FAQ content reloaded successfully",
  "files_loaded": 10,
  "files_changed": 1
}
```

## Configuration

Edit `mcp_config.json` to customize server settings:

```json
{
  "settings": {
    "faq_directory": "./faq",
    "log_level": "INFO",
    "max_concurrent_queries": 5,
    "response_timeout": 5.0
  }
}
```

## System Architecture

### 1. FAQ Content Manager

- Loads and parses FAQ files from the specified directory
- Structures content for Claude analysis
- Handles file reloading and caching

### 2. Claude Reasoning Engine

- Implements chain-of-thoughts analysis
- Compares user queries against FAQ content
- Makes relevance decisions and extracts answers

### 3. MCP Server

- Provides MCP protocol interface
- Orchestrates query processing
- Handles error management and logging

## Performance Characteristics

- **Response Time**: < 5 seconds for query processing
- **Memory Usage**: < 100MB for FAQ content loading
- **Concurrent Queries**: Supports up to 5 simultaneous requests
- **FAQ Capacity**: Handles 10+ FAQ files with 100+ Q&A pairs efficiently

## Troubleshooting

### Common Issues

1. **"FAQ directory not found"**

   - Ensure the `faq/` directory exists
   - Check that FAQ files are in `.txt` format

2. **"No FAQ files found"**

   - Verify `.txt` files exist in the FAQ directory
   - Check file permissions

3. **"Import mcp.server.fastmcp could not be resolved"**

   - Install the MCP library: `pip install mcp`
   - Ensure you're using the correct Python environment

4. **Poor answer quality**
   - Review FAQ file content and formatting
   - Ensure Q&A pairs are clearly structured
   - Consider adding more specific keywords to FAQ content

### Debug Mode

Enable debug logging by modifying the logging level in `faq_mcp_server.py`:

```python
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(message)s")
```

## Extending the System

### Adding New FAQ Categories

1. Create new `.txt` files in the `faq/` directory
2. Follow the Q&A format convention
3. Restart the server or use the `reload_faq_content` tool

### Improving Reasoning

The `ClaudeReasoningEngine` can be enhanced with:

- More sophisticated keyword matching
- Semantic similarity scoring
- Machine learning-based relevance classification

### Adding Analytics

Integrate with the FAQ Analytics Dashboard (see separate PRD) to track:

- Query patterns and frequency
- Response accuracy
- System performance metrics

## Future Enhancements

### V2.0 Planned Features

- **Vector Similarity**: Implement sentence transformers for more accurate matching
- **Multi-language Support**: Support for non-English FAQ content
- **Dynamic Learning**: Learn from user feedback to improve responses
- **Advanced Context**: Better handling of multi-part queries
- **External Knowledge**: Integration with external knowledge bases

## Support

For technical support or questions about this implementation:

1. Check the test suite output for diagnostic information
2. Review log files for error details
3. Verify FAQ content format and structure
4. Test with simple queries first before complex ones

## License

This implementation is part of the FAQ MCP project developed according to the technical specifications in the Product Requirements Document (PRD).
