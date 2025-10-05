"""
Opik Demo Script - Test LLM tracking and evaluation

This script demonstrates how to use Opik to track and analyze OpenAI API calls.
Run this script to test your Opik integration and see tracked calls in the Opik dashboard.

Usage:
    python -m app.opik

Make sure your OPENAI_API_KEY environment variable is set.
"""

import os
import asyncio
from dotenv import load_dotenv
from app.opik_config import get_tracked_openai_client, setup_opik

# Load environment variables
load_dotenv()


def test_basic_chat_completion():
    """Test basic chat completion with Opik tracking."""
    print("🤖 Testing basic chat completion with Opik tracking...")
    
    # Get a tracked OpenAI client
    client = get_tracked_openai_client()
    
    # Make a simple API call
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "Write a haiku about AI engineering."}
        ],
        max_tokens=100
    )
    
    print(f"✅ Response: {response.choices[0].message.content}")
    return response


def test_o4_mini_integration():
    """Test the o4-mini model integration with Opik tracking."""
    print("\n🚀 Testing o4-mini integration with Opik tracking...")
    
    from app.services.o4_mini_service import OpenAIo4Service
    
    # Initialize the service (it now uses Opik-tracked client)
    o4_service = OpenAIo4Service()
    
    # Test the API call
    system_prompt = "You are a helpful AI assistant. Be concise and friendly."
    user_input = "Explain quantum computing in simple terms."
    
    try:
        response = o4_service.call_o4_api(system_prompt, user_input)
        print(f"✅ o4-mini Response: {response}")
        return response
    except Exception as e:
        print(f"❌ Error with o4-mini: {str(e)}")
        return None


async def test_streaming_integration():
    """Test streaming API calls with Opik tracking."""
    print("\n🌊 Testing streaming integration with Opik tracking...")
    
    from app.services.o4_mini_service import OpenAIo4Service
    
    o4_service = OpenAIo4Service()
    
    system_prompt = "You are a creative writing assistant."
    user_input = "Write a short story about a robot learning to paint."
    
    try:
        print("Streaming response:")
        async for chunk in o4_service.call_o4_api_stream(system_prompt, user_input):
            print(chunk, end="", flush=True)
        print("\n✅ Streaming completed successfully")
    except Exception as e:
        print(f"\n❌ Error with streaming: {str(e)}")


def test_multiple_models():
    """Test different OpenAI models with Opik tracking."""
    print("\n🔄 Testing multiple models with Opik tracking...")
    
    client = get_tracked_openai_client()
    
    models_to_test = [
        "gpt-3.5-turbo",
        "gpt-4o-mini",
    ]
    
    for model in models_to_test:
        try:
            print(f"Testing {model}...")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": f"Say hello from {model}!"}
                ],
                max_tokens=50
            )
            print(f"✅ {model}: {response.choices[0].message.content}")
        except Exception as e:
            print(f"❌ {model} failed: {str(e)}")


def main():
    """Run all Opik integration tests."""
    print("🎯 Opik Integration Test Suite")
    print("=" * 50)
    
    # Check if API key is available
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY environment variable not found!")
        print("Please set your OpenAI API key in your .env file or environment.")
        return
    
    # Check if Opik is configured
    opik_enabled = os.getenv("OPIK_API_KEY") is not None
    if not opik_enabled:
        print("⚠️  OPIK_API_KEY not found. Tests will run without Opik tracking.")
        print("   Set OPIK_API_KEY to enable full tracking and evaluation features.")
        print("   Get your API key at: https://app.opik.ai")
        print()
    
    try:
        # Test basic functionality
        test_basic_chat_completion()
        
        # Test o4-mini integration
        test_o4_mini_integration()
        
        # Test multiple models
        test_multiple_models()
        
        # Test streaming (async)
        asyncio.run(test_streaming_integration())
        
        print("\n🎉 All tests completed!")
        
        if opik_enabled:
            print("\n📊 Check your Opik dashboard to see the tracked calls:")
            print("   https://app.opik.ai")
            print("\n💡 You can now analyze performance, costs, and quality metrics!")
        else:
            print("\n💡 Set OPIK_API_KEY to enable full tracking and evaluation features!")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        print("Make sure your OpenAI API key is valid and you have internet connectivity.")


if __name__ == "__main__":
    main()
