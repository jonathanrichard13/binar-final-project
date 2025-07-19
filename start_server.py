#!/usr/bin/env python3
"""
Simple launcher for the FAQ MCP Server
"""

import sys
import subprocess
from pathlib import Path


def main():
    """Launch the FAQ MCP Server"""

    # Check if we're in the right directory
    if not Path("faq_mcp_server.py").exists():
        print("❌ Error: faq_mcp_server.py not found in current directory")
        print("   Please run this script from the FAQ MCP Server directory")
        return 1

    # Check if FAQ directory exists
    if not Path("faq").exists():
        print("❌ Error: faq/ directory not found")
        print("   Please ensure the FAQ directory exists with .txt files")
        return 1

    print("🚀 Starting FAQ MCP Server...")
    print("   Press Ctrl+C to stop the server")
    print("-" * 50)

    try:
        # Run the server
        result = subprocess.run([sys.executable, "faq_mcp_server.py"])
        return result.returncode

    except KeyboardInterrupt:
        print("\n\n⏹️  Server stopped by user")
        return 0
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
