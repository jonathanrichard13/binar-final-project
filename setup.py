#!/usr/bin/env python3
"""
Setup script for FAQ MCP Server
"""

import os
import sys
import subprocess
from pathlib import Path


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)


def check_python_version():
    """Check if Python version is compatible"""
    print("Checking Python version...")
    version = sys.version_info

    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python 3.9+ required, found {version.major}.{version.minor}")
        return False

    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True


def install_dependencies():
    """Install required Python packages"""
    print("\nInstalling dependencies...")

    try:
        # Check if requirements.txt exists
        req_file = Path("requirements.txt")
        if not req_file.exists():
            print("❌ requirements.txt not found")
            return False

        # Install requirements
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
            return True
        else:
            print(f"❌ Failed to install dependencies: {result.stderr}")
            return False

    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False


def verify_faq_directory():
    """Verify FAQ directory and content"""
    print("\nVerifying FAQ directory...")

    faq_dir = Path("faq")

    if not faq_dir.exists():
        print("❌ FAQ directory not found")
        print("   Creating FAQ directory...")
        faq_dir.mkdir()
        print("✅ Created FAQ directory")
        print("   Please add your FAQ .txt files to the faq/ directory")
        return True

    # Check for FAQ files
    faq_files = list(faq_dir.glob("*.txt"))

    if not faq_files:
        print("⚠️  No FAQ files found in faq/ directory")
        print("   Please add your FAQ .txt files")
        return True

    print(f"✅ Found {len(faq_files)} FAQ files:")
    for faq_file in faq_files:
        print(f"   - {faq_file.name}")

    return True


def run_tests():
    """Run the test suite"""
    print("\nRunning test suite...")

    try:
        result = subprocess.run(
            [sys.executable, "test_faq_server.py"], capture_output=True, text=True
        )

        print("Test output:")
        print("-" * 40)
        print(result.stdout)

        if result.stderr:
            print("Errors/Warnings:")
            print(result.stderr)

        if result.returncode == 0:
            print("✅ All tests passed!")
            return True
        else:
            print("❌ Some tests failed")
            return False

    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False


def create_sample_faq():
    """Create a sample FAQ file if none exist"""
    faq_dir = Path("faq")
    faq_files = list(faq_dir.glob("*.txt"))

    if not faq_files:
        print("\nCreating sample FAQ file...")

        sample_content = """Q: What is this FAQ system?
A: This is an intelligent FAQ system that uses Claude's reasoning to answer questions based on a knowledge base of FAQ files.

Q: How do I add more questions?
A: Create or edit .txt files in the faq/ directory following the Q: and A: format shown in this example.

Q: How does the system work?
A: The system loads FAQ content, analyzes user queries using Claude's chain-of-thoughts reasoning, and returns the most relevant answers.
"""

        sample_file = faq_dir / "sample_faq.txt"
        sample_file.write_text(sample_content, encoding="utf-8")

        print(f"✅ Created sample FAQ file: {sample_file}")
        print("   You can edit this file or add more FAQ files as needed")


def main():
    """Main setup function"""
    print_header("FAQ MCP Server Setup")

    print("This script will set up the FAQ MCP Server environment")
    print("and verify that everything is working correctly.")

    # Check Python version
    if not check_python_version():
        print("\n❌ Setup failed: Incompatible Python version")
        return False

    # Install dependencies
    if not install_dependencies():
        print("\n❌ Setup failed: Could not install dependencies")
        return False

    # Verify FAQ directory
    if not verify_faq_directory():
        print("\n❌ Setup failed: FAQ directory issues")
        return False

    # Create sample FAQ if needed
    create_sample_faq()

    # Run tests
    print_header("Running Tests")
    test_success = run_tests()

    # Final status
    print_header("Setup Complete")

    if test_success:
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Review and customize FAQ files in the faq/ directory")
        print("2. Run the server: python faq_mcp_server.py")
        print("3. Configure Claude Desktop to connect to your MCP server")
        print("\nFor more information, see README.md")
    else:
        print("⚠️  Setup completed with warnings")
        print("Some tests failed, but basic setup is complete.")
        print("Please review the test output above and fix any issues.")
        print("\nYou can still run the server with: python faq_mcp_server.py")

    return test_success


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        sys.exit(1)
