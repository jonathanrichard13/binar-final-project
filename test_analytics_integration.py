"""
Test script for FAQ Analytics Integration
Tests the MCP server with analytics logging functionality
"""

import asyncio
import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from analytics_logger import analytics_logger


async def test_analytics_logging():
    """Test analytics logging functionality"""
    print("🧪 Testing FAQ Analytics Integration")
    print("=" * 50)

    # Test 1: Log a successful FAQ interaction
    print("📊 Test 1: Logging successful FAQ interaction...")
    success_data = {
        "query_text": "How do I sign up for VitalAccount?",
        "status": "success",
        "source_file": "account_management.txt",
        "reasoning": "Found relevant answer in account management FAQ",
        "processing_time": 1.23,
        "session_id": "test-session-1",
    }

    result1 = await analytics_logger.log_faq_interaction(success_data)
    print(f"   Result: {'✅ Success' if result1 else '❌ Failed'}")

    # Test 2: Log an unanswered question
    print("\n❓ Test 2: Logging unanswered question...")
    unanswered_data = {
        "question": "How do I integrate VitalDevice with my smartwatch?",
        "session_id": "test-session-2",
        "reasoning_trace": {"analysis": "No relevant FAQ found"},
    }

    result2 = await analytics_logger.log_unanswered_question(unanswered_data)
    print(f"   Result: {'✅ Success' if result2 else '❌ Failed'}")

    # Test 3: Log a no-answer interaction
    print("\n🚫 Test 3: Logging no-answer interaction...")
    no_answer_data = {
        "query_text": "What is the meaning of life in relation to VitalSync?",
        "status": "no_answer",
        "reasoning": "Query not relevant to available FAQ content",
        "processing_time": 0.95,
        "session_id": "test-session-3",
    }

    result3 = await analytics_logger.log_faq_interaction(no_answer_data)
    print(f"   Result: {'✅ Success' if result3 else '❌ Failed'}")

    # Test 4: Log system metrics
    print("\n⚡ Test 4: Logging system metrics...")
    result4 = await analytics_logger.log_system_metric("response_time", 1230.5, "ms")
    result5 = await analytics_logger.log_system_metric("memory_usage", 85.2, "%")
    print(f"   Response time metric: {'✅ Success' if result4 else '❌ Failed'}")
    print(f"   Memory usage metric: {'✅ Success' if result5 else '❌ Failed'}")

    # Test 5: Get analytics summary
    print("\n📈 Test 5: Getting analytics summary...")
    summary = await analytics_logger.get_analytics_summary()
    if summary:
        print("   ✅ Analytics summary retrieved:")
        for key, value in summary.items():
            print(f"      {key}: {value}")
    else:
        print("   ❌ Failed to get analytics summary")

    # Calculate overall test results
    all_tests = [result1, result2, result3, result4, result5, bool(summary)]
    passed_tests = sum(all_tests)
    total_tests = len(all_tests)

    print(f"\n📊 Test Results: {passed_tests}/{total_tests} tests passed")

    if passed_tests == total_tests:
        print("🎉 All analytics tests passed! The system is ready.")
    else:
        print("⚠️  Some tests failed. Please check the database connection and setup.")

    return passed_tests == total_tests


async def test_mcp_server_tools():
    """Test MCP server tools that use analytics"""
    print("\n🔧 Testing MCP Server Analytics Tools")
    print("=" * 50)

    try:
        from faq_mcp_server import get_analytics_summary

        print("📊 Testing get_analytics_summary tool...")
        result = await get_analytics_summary()

        if result.get("status") == "success":
            print("   ✅ Analytics summary tool working correctly")
            analytics_data = result.get("analytics", {})
            print("   📈 Current analytics:")
            for key, value in analytics_data.items():
                print(f"      {key}: {value}")
            return True
        else:
            print(f"   ❌ Analytics summary tool failed: {result.get('message')}")
            return False

    except Exception as e:
        print(f"   ❌ Error testing MCP server tools: {e}")
        return False


async def simulate_faq_usage():
    """Simulate realistic FAQ usage for testing"""
    print("\n🎭 Simulating Realistic FAQ Usage")
    print("=" * 50)

    # Sample queries that would be common for Vitalynk
    sample_queries = [
        {
            "query": "How do I create a VitalAccount?",
            "status": "success",
            "source_file": "account_management.txt",
        },
        {
            "query": "VitalDevice won't sync with VitalMobile app",
            "status": "success",
            "source_file": "technical_issues.txt",
        },
        {
            "query": "What are the VitalPlan subscription options?",
            "status": "success",
            "source_file": "subscription_plans.txt",
        },
        {
            "query": "How to export VitalData to external systems?",
            "status": "no_answer",
            "source_file": None,
        },
        {
            "query": "VitalDevice battery life optimization tips",
            "status": "no_answer",
            "source_file": None,
        },
    ]

    print(f"📝 Logging {len(sample_queries)} sample interactions...")

    for i, query_data in enumerate(sample_queries, 1):
        interaction_data = {
            "query_text": query_data["query"],
            "status": query_data["status"],
            "source_file": query_data["source_file"],
            "reasoning": f"Test reasoning for query {i}",
            "processing_time": 1.0 + (i * 0.2),  # Simulated processing time
            "session_id": f"simulation-session-{i}",
        }

        # Log the interaction
        result = await analytics_logger.log_faq_interaction(interaction_data)

        # If it's a no_answer, also log as unanswered question
        if query_data["status"] == "no_answer":
            await analytics_logger.log_unanswered_question(
                {
                    "question": query_data["query"],
                    "session_id": f"simulation-session-{i}",
                }
            )

        print(f"   {i}. {'✅' if result else '❌'} {query_data['query'][:50]}...")

    print("\n📊 Updated analytics summary after simulation:")
    summary = await analytics_logger.get_analytics_summary()
    if summary:
        for key, value in summary.items():
            print(f"   {key}: {value}")


async def main():
    """Main test function"""
    print("🏥 Vitalynk FAQ Analytics Integration Test")
    print("=" * 60)
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    try:
        # Test basic analytics functionality
        analytics_success = await test_analytics_logging()

        if analytics_success:
            # Test MCP server integration
            mcp_success = await test_mcp_server_tools()

            if mcp_success:
                # Simulate realistic usage
                await simulate_faq_usage()

                print("\n🎉 All tests completed successfully!")
                print("🚀 The FAQ Analytics system is ready for production use.")
            else:
                print("\n⚠️  MCP server integration tests failed.")
        else:
            print("\n❌ Basic analytics tests failed. Please check database setup.")

    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        import traceback

        traceback.print_exc()

    print("\n" + "=" * 60)
    print(f"🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
