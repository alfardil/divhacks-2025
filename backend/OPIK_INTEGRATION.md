# Opik Integration Guide

This project is now integrated with [Opik](https://opik.ai), an LLM observability and evaluation platform that helps you track, analyze, and improve your AI applications.

## What is Opik?

Opik provides:
- **Real-time LLM call tracking** - See all your OpenAI API calls in one dashboard
- **Performance monitoring** - Track latency, token usage, and costs
- **Quality evaluation** - Set up custom metrics to evaluate response quality
- **Cost analysis** - Monitor and optimize your API spending
- **Error tracking** - Identify and debug issues quickly

## Setup

### 1. Environment Variables

Make sure you have your OpenAI API key set:

```bash
export OPENAI_API_KEY="your_openai_api_key_here"
```

For full Opik tracking, also set your Opik API key:

```bash
export OPIK_API_KEY="your_opik_api_key_here"
```

Or create a `.env` file in the backend directory:
```
OPENAI_API_KEY=your_openai_api_key_here
OPIK_API_KEY=your_opik_api_key_here
```

**Note:** The application will work without `OPIK_API_KEY`, but LLM calls won't be tracked.

#### Getting Your Opik API Key

1. Visit [https://app.opik.ai](https://app.opik.ai)
2. Sign up for a free account
3. Go to your account settings
4. Copy your API key
5. Set it as the `OPIK_API_KEY` environment variable

### 2. Install Dependencies

The required packages are already in `requirements.txt`:
- `opik` - The Opik tracking library
- `openai` - OpenAI Python client

Install them with:
```bash
pip install -r requirements.txt
```

### 3. Run the Demo

Test your Opik integration:

```bash
cd backend
python -m app.opik
```

This will run a comprehensive test suite that demonstrates:
- Basic chat completions
- o4-mini model integration
- Streaming responses
- Multiple model testing

## How It Works

### Automatic Tracking

All OpenAI API calls are automatically tracked through the `OpenAIo4Service` class. The integration happens in:

1. **`app/opik_config.py`** - Configuration and setup
2. **`app/services/o4_mini_service.py`** - Uses tracked OpenAI client
3. **`app/main.py`** - Initializes Opik on startup

### What Gets Tracked

- **API calls** - All requests to OpenAI
- **Responses** - Complete response data
- **Timing** - Request duration and latency
- **Token usage** - Input/output token counts
- **Costs** - Estimated API costs
- **Errors** - Any failures or exceptions

### Viewing Your Data

1. Visit [https://app.opik.ai](https://app.opik.ai)
2. Sign up or log in to your account
3. View your tracked calls in the dashboard
4. Set up custom evaluations and alerts

## API Endpoints

Your existing endpoints now automatically track LLM calls:

- `GET /generate/test` - Basic o4-mini test (tracked)
- `GET /generate/stream-test` - Streaming test (tracked)

## Customization

### Adding Custom Metadata

You can add custom metadata to your tracked calls:

```python
from app.opik_config import get_tracked_openai_client

client = get_tracked_openai_client()

# Add custom metadata
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello"}],
    # Custom metadata will be tracked
    extra_headers={"X-Custom-Tag": "user-onboarding"}
)
```

### Disabling Tracking

If you need to disable tracking for specific calls:

```python
from app.opik_config import get_untracked_openai_client

# This client won't be tracked
client = get_untracked_openai_client()
```

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY not found"**
   - Make sure your environment variable is set correctly
   - Check that your `.env` file is in the backend directory

2. **"Opik configuration failed"**
   - Ensure you have internet connectivity
   - Check that the `opik` package is installed

3. **No data in Opik dashboard**
   - Wait a few minutes for data to appear
   - Check that your API calls are actually being made
   - Verify your Opik account is set up correctly

### Getting Help

- [Opik Documentation](https://docs.opik.ai)
- [Opik Support](https://opik.ai/support)
- Check the console output for error messages

## Next Steps

1. **Set up evaluations** - Create custom quality metrics
2. **Configure alerts** - Get notified of issues
3. **Analyze costs** - Optimize your API usage
4. **Monitor performance** - Track response times and reliability

Happy tracking! 🚀
