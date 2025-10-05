"""
Opik configuration and setup for LLM tracking and evaluation.

This module handles the initialization and configuration of Opik for tracking
OpenAI API calls and other LLM interactions in the application.
"""

import os
from opik import configure
from opik.integrations.openai import track_openai
from openai import OpenAI


def setup_opik():
    """
    Initialize and configure Opik for LLM tracking.

    This function should be called once at application startup to ensure
    all OpenAI calls are properly tracked by Opik.
    """
    # Verify that OPENAI_API_KEY is available
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable is required for Opik integration"
        )

    # Check if Opik API key is available
    opik_api_key = os.getenv("OPIK_API_KEY")
    if not opik_api_key:
        print("⚠️  OPIK_API_KEY not found. Opik tracking will be disabled.")
        print("   To enable Opik tracking, set OPIK_API_KEY environment variable.")
        print("   Get your API key at: https://app.opik.ai")
        return False

    # Check if Opik has been disabled due to previous errors
    if os.getenv("OPIK_DISABLED"):
        print("🚫 Opik tracking disabled due to previous errors.")
        return False

    try:
        # Configure Opik with explicit settings to avoid proxy issues
        configure(
            api_key=opik_api_key,
            # Disable proxy to avoid httpx compatibility issues
            proxy=None,
            # Use basic configuration to avoid conflicts
            environment="production",
        )
        print("✅ Opik configured successfully for LLM tracking")
        return True
    except Exception as e:
        error_msg = str(e)
        print(f"⚠️  Failed to configure Opik: {error_msg}")

        # If it's the proxy error, mark Opik as disabled
        if "proxy" in error_msg.lower():
            print("🚫 Opik proxy error detected. Disabling Opik tracking.")
            os.environ["OPIK_DISABLED"] = "true"

        print("   Opik tracking will be disabled.")
        # Return False instead of raising to allow app to continue without Opik
        return False


def get_tracked_openai_client():
    """
    Get a tracked OpenAI client that automatically logs all API calls to Opik.

    Returns:
        OpenAI: A tracked OpenAI client instance (tracked if Opik is configured)
    """
    # Check if Opik is configured
    opik_api_key = os.getenv("OPIK_API_KEY")

    if opik_api_key and not os.getenv("OPIK_DISABLED"):
        try:
            # Create and return a tracked OpenAI client
            tracked_client = track_openai(OpenAI())
            print("✅ Using Opik-tracked OpenAI client")
            return tracked_client
        except Exception as e:
            error_msg = str(e)
            print(f"⚠️  Failed to create tracked client: {error_msg}")

            # If it's the proxy error, disable Opik tracking completely
            if "proxy" in error_msg.lower():
                print(
                    "🚫 Opik proxy error detected. Disabling Opik tracking for this session."
                )
                # Set environment variable to disable Opik
                os.environ["OPIK_DISABLED"] = "true"

            print("   Falling back to untracked client.")
            return OpenAI()
    else:
        # Return untracked client if Opik is not configured or disabled
        if os.getenv("OPIK_DISABLED"):
            print("🔧 Using untracked client (Opik disabled due to errors)")
        else:
            print("🔧 Using untracked client (Opik not configured)")
        return OpenAI()


def get_untracked_openai_client():
    """
    Get a regular OpenAI client without Opik tracking.

    This is useful for cases where you don't want to track certain calls.

    Returns:
        OpenAI: A regular OpenAI client instance
    """
    return OpenAI()
