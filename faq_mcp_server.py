import asyncio
import logging
import time
import sys
from datetime import datetime
from typing import Dict, Optional
from pathlib import Path

# MCP server imports
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
import mcp.server.stdio

from faq_content_manager import FAQContentManager
from claude_reasoning_engine import ClaudeReasoningEngine


# Configure logging to stderr so it appears in Claude Desktop logs
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(message)s", stream=sys.stderr
)


def send_log_message(message: str):
    logging.info(f"[FAQ-Server] {message}")


# Create MCP server
server = Server("FAQ-Server")
send_log_message("Initializing FAQ MCP server...")


class FAQMCPServer:
    """Main MCP server for FAQ system"""

    def __init__(self, faq_directory: str = None):
        # Use absolute path to ensure FAQ directory is found
        if faq_directory is None:
            # Get the directory where this script is located
            script_dir = Path(__file__).parent.absolute()
            faq_directory = str(script_dir / "faq")

        send_log_message(f"Using FAQ directory: {faq_directory}")
        self.faq_manager = FAQContentManager(faq_directory)
        self.reasoning_engine = ClaudeReasoningEngine()

        # Load FAQ content on initialization
        try:
            self.faq_manager.load_all_faqs()
            send_log_message(
                f"FAQ server initialized with {len(self.faq_manager.faq_content)} FAQ files"
            )
        except Exception as e:
            send_log_message(f"Error initializing FAQ content: {e}")


# Initialize the FAQ server instance
faq_server_instance = FAQMCPServer()


@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available tools"""
    send_log_message("Tools list requested")
    return [
        types.Tool(
            name="answer_faq",
            description="Answer questions based on FAQ knowledge base",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "User question to be answered",
                    }
                },
                "required": ["query"],
            },
        ),
        types.Tool(
            name="list_faq_files",
            description="List all available FAQ files and their content summary",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="reload_faq_content",
            description="Reload FAQ content from files",
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent]:
    """Handle tool calls"""
    send_log_message(f"Tool called: {name} with args: {arguments}")

    try:
        if name == "answer_faq":
            if not arguments or "query" not in arguments:
                return [
                    types.TextContent(
                        type="text", text="Error: Missing 'query' parameter"
                    )
                ]

            query = arguments["query"]
            result = await handle_query(query)
            return [types.TextContent(type="text", text=str(result))]

        elif name == "list_faq_files":
            result = await list_available_faqs()
            return [types.TextContent(type="text", text=str(result))]

        elif name == "reload_faq_content":
            result = await reload_faqs()
            return [types.TextContent(type="text", text=str(result))]

        else:
            return [
                types.TextContent(type="text", text=f"Error: Unknown tool '{name}'")
            ]

    except Exception as e:
        send_log_message(f"Error in tool call {name}: {e}")
        return [types.TextContent(type="text", text=f"Error: {str(e)}")]


async def handle_query(query: str) -> Dict:
    """Orchestrate FAQ analysis and response generation"""
    start_time = time.time()

    try:
        # Validate input
        if not query or not query.strip():
            return {
                "status": "error",
                "message": "Query cannot be empty",
                "processing_time": time.time() - start_time,
            }

        send_log_message(f"Processing query: {query[:100]}...")

        # Ensure FAQ content is loaded
        if not faq_server_instance.faq_manager.faq_content:
            faq_server_instance.faq_manager.load_all_faqs()

        if not faq_server_instance.faq_manager.faq_content:
            return {
                "status": "error",
                "message": "No FAQ content available",
                "processing_time": time.time() - start_time,
            }

        # Get structured content for analysis
        faq_content = (
            faq_server_instance.faq_manager.get_structured_content_for_claude()
        )

        # Perform Claude reasoning analysis
        analysis_result = (
            await faq_server_instance.reasoning_engine.analyze_query_against_faqs(
                query, faq_content
            )
        )

        processing_time = time.time() - start_time

        # Format response based on analysis
        if analysis_result.get("decision") == "ANSWER":
            response = {
                "status": "success",
                "answer": analysis_result.get("answer"),
                "source_file": analysis_result.get("best_match_file"),
                "reasoning": faq_server_instance.reasoning_engine.format_reasoning_for_user(
                    analysis_result
                ),
                "processing_time": processing_time,
            }
            send_log_message(
                f"Query answered successfully from {analysis_result.get('best_match_file')}"
            )
        else:
            response = {
                "status": "no_answer",
                "message": "I cannot answer this question based on the available FAQ content. Please contact customer support for assistance.",
                "reasoning": faq_server_instance.reasoning_engine.format_reasoning_for_user(
                    analysis_result
                ),
                "processing_time": processing_time,
            }
            send_log_message("Query could not be answered - no relevant content found")

        return response

    except Exception as e:
        processing_time = time.time() - start_time
        error_msg = f"Error processing query: {str(e)}"
        send_log_message(error_msg)

        return {
            "status": "error",
            "message": error_msg,
            "processing_time": processing_time,
        }


async def list_available_faqs() -> Dict:
    """List all available FAQ files and their summary"""
    try:
        # Ensure content is loaded
        if not faq_server_instance.faq_manager.faq_content:
            faq_server_instance.faq_manager.load_all_faqs()

        file_summary = faq_server_instance.faq_manager.get_file_summary()
        total_qas = sum(file_summary.values())

        return {
            "status": "success",
            "total_files": len(file_summary),
            "total_qa_pairs": total_qas,
            "files": [
                {
                    "filename": filename,
                    "qa_count": count,
                    "category": filename.replace(".txt", "").replace("_", " ").title(),
                }
                for filename, count in file_summary.items()
            ],
            "last_loaded": (
                faq_server_instance.faq_manager.last_loaded.isoformat()
                if faq_server_instance.faq_manager.last_loaded
                else None
            ),
        }

    except Exception as e:
        return {"status": "error", "message": f"Error listing FAQ files: {str(e)}"}


async def reload_faqs() -> Dict:
    """Reload FAQ content from files"""
    try:
        old_count = len(faq_server_instance.faq_manager.faq_content)
        faq_server_instance.faq_manager.load_all_faqs()
        new_count = len(faq_server_instance.faq_manager.faq_content)

        return {
            "status": "success",
            "message": f"FAQ content reloaded successfully",
            "files_loaded": new_count,
            "files_changed": new_count - old_count,
            "reload_time": datetime.now().isoformat(),
        }

    except Exception as e:
        return {"status": "error", "message": f"Error reloading FAQ content: {str(e)}"}


async def main():
    """Main function to run the MCP server"""
    # Run the server using stdio transport
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        send_log_message("FAQ MCP Server starting with stdio transport...")
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="FAQ-Server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    send_log_message("FAQ MCP Server starting...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        send_log_message("FAQ MCP Server stopped by user")
    except Exception as e:
        send_log_message(f"FAQ MCP Server error: {e}")
        sys.exit(1)
