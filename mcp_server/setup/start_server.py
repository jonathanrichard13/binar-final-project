#!/usr/bin/env python3
"""
Simple launcher for the FAQ MCP Server
"""

import sys
import subprocess
from pathlib import Path


def main():
    """Launch the FAQ MCP Server"""

    # Check if we're in the right directory (parent directory should have the server file)
    server_file = Path("../faq_mcp_server.py")
    if not server_file.exists():
        print("❌ Error: faq_mcp_server.py not found in parent directory")
        print("   Please run this script from the FAQ MCP Server setup directory")
        return 1

    # Check if FAQ directory exists (in parent directory)
    faq_dir = Path("../faq")
    if not faq_dir.exists():
        print("❌ Error: faq/ directory not found")
        print("   Please ensure the FAQ directory exists with .txt files")
        return 1

    print("🚀 Starting FAQ MCP Server...")
    print("   Press Ctrl+C to stop the server")
    print("-" * 50)

    try:
        # Run the server (change to parent directory first)
        result = subprocess.run(
            [sys.executable, "../faq_mcp_server.py"], cwd=Path(__file__).parent.parent
        )
        return result.returncode

    except KeyboardInterrupt:
        print("\n\n⏹️  Server stopped by user")
        return 0
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
