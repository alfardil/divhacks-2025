"""
Sample Python file with database operations for testing LLM Jury
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional

class UserDatabase:
    """A poorly optimized database class for testing"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self.connection = None
    
    def connect(self):
        """Connect to database - no connection pooling"""
        self.connection = sqlite3.connect(self.db_path)
        return self.connection
    
    def create_tables(self):
        """Create user tables"""
        cursor = self.connection.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                email TEXT,
                password TEXT
            )
        """)
        self.connection.commit()
    
    def add_user(self, username: str, email: str, password: str):
        """Add user - vulnerable to SQL injection"""
        cursor = self.connection.cursor()
        # BAD: Direct string interpolation
        query = f"INSERT INTO users (username, email, password) VALUES ('{username}', '{email}', '{password}')"
        cursor.execute(query)
        self.connection.commit()
    
    def get_user_by_id(self, user_id: int):
        """Get user by ID - inefficient query"""
        cursor = self.connection.cursor()
        # BAD: No prepared statement
        cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
        return cursor.fetchone()
    
    def get_all_users(self):
        """Get all users - no pagination"""
        cursor = self.connection.cursor()
        cursor.execute("SELECT * FROM users")
        return cursor.fetchall()
    
    def search_users(self, search_term: str):
        """Search users - inefficient LIKE query"""
        cursor = self.connection.cursor()
        # BAD: No indexing, full table scan
        cursor.execute(f"SELECT * FROM users WHERE username LIKE '%{search_term}%'")
        return cursor.fetchall()
    
    def close(self):
        """Close connection"""
        if self.connection:
            self.connection.close()

# LLM Integration example
def analyze_user_behavior(user_data: List[Dict[str, Any]]) -> str:
    """Analyze user behavior using LLM - inefficient token usage"""
    
    # BAD: Sending entire dataset to LLM
    prompt = f"Analyze this user data: {user_data}"
    
    # This would be tracked by Opik
    # response = llm_client.chat.completions.create(
    #     model="gpt-4",
    #     messages=[{"role": "user", "content": prompt}]
    # )
    
    return "Analysis complete"

if __name__ == "__main__":
    # Example usage
    db = UserDatabase()
    db.connect()
    db.create_tables()
    
    # Add some test data
    db.add_user("john_doe", "john@example.com", "password123")
    db.add_user("jane_smith", "jane@example.com", "mypassword")
    
    # Search users
    results = db.search_users("john")
    print(f"Found {len(results)} users")
    
    db.close()
