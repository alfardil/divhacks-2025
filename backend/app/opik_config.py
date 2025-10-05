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
    
    try:
        # Configure Opik - this sets up the tracking infrastructure
        configure()
        print("✅ Opik configured successfully for LLM tracking")
        return True
    except Exception as e:
        print(f"⚠️  Failed to configure Opik: {str(e)}")
        print("   Opik tracking will be disabled.")
        return False


def get_tracked_openai_client():
    """
    Get a tracked OpenAI client that automatically logs all API calls to Opik.
    
    Returns:
        OpenAI: A tracked OpenAI client instance (tracked if Opik is configured)
    """
    # Check if Opik is configured
    opik_api_key = os.getenv("OPIK_API_KEY")
    
    if opik_api_key:
        try:
            # Create and return a tracked OpenAI client
            return track_openai(OpenAI())
        except Exception as e:
            print(f"⚠️  Failed to create tracked client: {str(e)}")
            print("   Falling back to untracked client.")
            return OpenAI()
    else:
        # Return untracked client if Opik is not configured
        return OpenAI()


def get_untracked_openai_client():
    """
    Get a regular OpenAI client without Opik tracking.
    
    This is useful for cases where you don't want to track certain calls.
    
    Returns:
        OpenAI: A regular OpenAI client instance
    """
    return OpenAI()
