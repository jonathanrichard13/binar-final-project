#!/usr/bin/env python3
"""
Test script for FAQ MCP Server
This script tests the core functionality without requiring the full MCP infrastructure
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent directory to path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from faq_content_manager import FAQContentManager
from claude_reasoning_engine import ClaudeReasoningEngine


async def test_faq_content_manager():
    """Test FAQ content loading and parsing"""
    print("=" * 50)
    print("Testing FAQ Content Manager")
    print("=" * 50)

    try:
        # Initialize FAQ manager
        faq_manager = FAQContentManager("./faq")

        # Test loading FAQ content
        print("Loading FAQ content...")
        content = faq_manager.load_all_faqs()

        print(f"Loaded {len(content)} FAQ files:")
        for filename, qa_pairs in content.items():
            print(f"  - {filename}: {len(qa_pairs)} Q&A pairs")

        # Test structured content generation
        print("\nGenerating structured content for Claude...")
        structured_content = faq_manager.get_structured_content_for_claude()
        print(f"Generated content length: {len(structured_content)} characters")
        print("Sample content (first 500 chars):")
        print(
            structured_content[:500] + "..."
            if len(structured_content) > 500
            else structured_content
        )

        # Test file summary
        print("\nFile summary:")
        summary = faq_manager.get_file_summary()
        for filename, count in summary.items():
            print(f"  {filename}: {count} Q&A pairs")

        return True

    except Exception as e:
        print(f"Error testing FAQ Content Manager: {e}")
        return False


async def test_claude_reasoning_engine():
    """Test Claude reasoning engine"""
    print("\n" + "=" * 50)
    print("Testing Claude Reasoning Engine")
    print("=" * 50)

    try:
        # Initialize components
        faq_manager = FAQContentManager("./faq")
        reasoning_engine = ClaudeReasoningEngine()

        # Load FAQ content
        faq_manager.load_all_faqs()
        structured_content = faq_manager.get_structured_content_for_claude()

        # Test queries
        test_queries = [
            "How do I create a new account?",
            "I forgot my password",
            "What payment methods do you accept?",
            "How can I contact support?",
            "What is the meaning of life?",  # Should return NO_ANSWER
            "Can I upload files?",
        ]

        print("Testing queries:")
        for i, query in enumerate(test_queries, 1):
            print(f"\n--- Test Query {i} ---")
            print(f"Query: {query}")

            # Analyze query
            result = await reasoning_engine.analyze_query_against_faqs(
                query, structured_content
            )

            print(f"Decision: {result.get('decision')}")
            print(f"Best match file: {result.get('best_match_file')}")
            print(f"Relevance: {result.get('relevance_score')}")
            print(f"Analysis: {result.get('analysis')}")

            if result.get("answer"):
                print(f"Answer: {result.get('answer')[:200]}...")

        return True

    except Exception as e:
        print(f"Error testing Claude Reasoning Engine: {e}")
        return False


async def test_full_query_processing():
    """Test full end-to-end query processing"""
    print("\n" + "=" * 50)
    print("Testing Full Query Processing")
    print("=" * 50)

    try:
        # Create a mock FAQ server instance (without MCP dependencies)
        class MockFAQServer:
            def __init__(self):
                self.faq_manager = FAQContentManager("./faq")
                self.reasoning_engine = ClaudeReasoningEngine()
                self.faq_manager.load_all_faqs()

            async def handle_query(self, query: str):
                """Simulate the handle_query method"""
                import time

                start_time = time.time()

                if not query or not query.strip():
                    return {
                        "status": "error",
                        "message": "Query cannot be empty",
                        "processing_time": time.time() - start_time,
                    }

                faq_content = self.faq_manager.get_structured_content_for_claude()
                analysis_result = (
                    await self.reasoning_engine.analyze_query_against_faqs(
                        query, faq_content
                    )
                )

                processing_time = time.time() - start_time

                if analysis_result.get("decision") == "ANSWER":
                    return {
                        "status": "success",
                        "answer": analysis_result.get("answer"),
                        "source_file": analysis_result.get("best_match_file"),
                        "reasoning": self.reasoning_engine.format_reasoning_for_user(
                            analysis_result
                        ),
                        "processing_time": processing_time,
                    }
                else:
                    return {
                        "status": "no_answer",
                        "message": "I cannot answer this question based on the available FAQ content. Please contact customer support for assistance.",
                        "reasoning": self.reasoning_engine.format_reasoning_for_user(
                            analysis_result
                        ),
                        "processing_time": processing_time,
                    }

        # Test the mock server
        mock_server = MockFAQServer()

        test_cases = [
            "How do I reset my password?",
            "What are your support hours?",
            "Can I get a refund?",
            "How do I delete my account?",
            "What is quantum physics?",  # Should not be answerable
        ]

        print("Testing end-to-end query processing:")
        for i, query in enumerate(test_cases, 1):
            print(f"\n--- End-to-End Test {i} ---")
            print(f"Query: {query}")

            response = await mock_server.handle_query(query)

            print(f"Status: {response.get('status')}")
            print(f"Processing time: {response.get('processing_time', 0):.3f}s")

            if response.get("status") == "success":
                print(f"Source: {response.get('source_file')}")
                print(f"Answer: {response.get('answer', '')[:150]}...")
            elif response.get("status") == "no_answer":
                print(f"Message: {response.get('message')}")

            if response.get("reasoning"):
                print(f"Reasoning: {response.get('reasoning')}")

        return True

    except Exception as e:
        print(f"Error testing full query processing: {e}")
        return False


async def main():
    """Run all tests"""
    print("FAQ MCP Server Test Suite")
    print("=" * 50)

    # Check if FAQ directory exists
    faq_path = Path("./faq")
    if not faq_path.exists():
        print(f"Error: FAQ directory not found at {faq_path.absolute()}")
        print("Please ensure the FAQ directory exists with .txt files")
        return

    # Count FAQ files
    faq_files = list(faq_path.glob("*.txt"))
    print(f"Found {len(faq_files)} FAQ files in {faq_path.absolute()}")

    if not faq_files:
        print("Warning: No .txt files found in FAQ directory")
        return

    # Run tests
    tests = [
        ("FAQ Content Manager", test_faq_content_manager),
        ("Claude Reasoning Engine", test_claude_reasoning_engine),
        ("Full Query Processing", test_full_query_processing),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            success = await test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"Test {test_name} failed with exception: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)

    passed = 0
    for test_name, success in results:
        status = "PASSED" if success else "FAILED"
        print(f"{test_name}: {status}")
        if success:
            passed += 1

    print(f"\nOverall: {passed}/{len(results)} tests passed")

    if passed == len(results):
        print("\n✅ All tests passed! The FAQ MCP server is ready for deployment.")
    else:
        print(
            f"\n❌ {len(results) - passed} test(s) failed. Please check the errors above."
        )


if __name__ == "__main__":
    asyncio.run(main())
