"""
Sample Python file with LLM optimization issues for testing
"""

import openai
import json
import time
from typing import List, Dict, Any

class ChatBot:
    """A chatbot with various optimization issues"""
    
    def __init__(self, api_key: str):
        # BAD: API key in plain text
        self.api_key = api_key
        self.client = openai.OpenAI(api_key=api_key)
        self.conversation_history = []
    
    def chat(self, message: str) -> str:
        """Chat with user - inefficient token usage"""
        
        # BAD: No conversation length limit
        self.conversation_history.append({"role": "user", "content": message})
        
        # BAD: Using expensive model for simple tasks
        response = self.client.chat.completions.create(
            model="gpt-4",  # Expensive!
            messages=self.conversation_history,
            max_tokens=4000,  # Too many tokens
            temperature=0.9   # High randomness for simple chat
        )
        
        reply = response.choices[0].message.content
        self.conversation_history.append({"role": "assistant", "content": reply})
        
        return reply
    
    def analyze_document(self, document: str) -> Dict[str, Any]:
        """Analyze document - inefficient approach"""
        
        # BAD: Sending entire document to LLM
        prompt = f"""
        Analyze this document and provide:
        1. Summary
        2. Key points
        3. Sentiment analysis
        4. Action items
        
        Document: {document}
        """
        
        # BAD: No caching, no streaming
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        
        # BAD: No error handling
        result = json.loads(response.choices[0].message.content)
        return result
    
    def batch_process(self, items: List[str]) -> List[str]:
        """Process multiple items - inefficient batching"""
        
        results = []
        for item in items:
            # BAD: Processing one by one instead of batching
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": f"Process: {item}"}],
                max_tokens=100
            )
            results.append(response.choices[0].message.content)
            
            # BAD: No rate limiting
            time.sleep(0.1)
        
        return results
    
    def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings - inefficient model choice"""
        
        # BAD: Using expensive embedding model for simple tasks
        response = self.client.embeddings.create(
            model="text-embedding-3-large",  # Expensive!
            input=text
        )
        
        return response.data[0].embedding

# Security issues
def process_user_input(user_input: str) -> str:
    """Process user input - security vulnerabilities"""
    
    # BAD: No input validation
    # BAD: No sanitization
    # BAD: Direct string formatting
    
    prompt = f"User said: {user_input}. Respond helpfully."
    
    # This would be tracked by Opik
    # response = llm_client.chat.completions.create(
    #     model="gpt-3.5-turbo",
    #     messages=[{"role": "user", "content": prompt}]
    # )
    
    return f"Processed: {user_input}"

if __name__ == "__main__":
    # Example usage
    bot = ChatBot("your-api-key-here")
    
    # Test chat
    response = bot.chat("Hello, how are you?")
    print(f"Bot: {response}")
    
    # Test document analysis
    doc = "This is a sample document for analysis."
    analysis = bot.analyze_document(doc)
    print(f"Analysis: {analysis}")
