"""
Character-based LLM Jury System with controlled outputs

This module provides judge characters with specific personalities and
controlled response formats for the frontend display.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.o4_mini_service import OpenAIo4Service
import json
import os

router = APIRouter(prefix="/character-jury", tags=["Character Jury"])

# Initialize the service (already Opik-tracked)
o4_service = OpenAIo4Service()


class FileSubmission(BaseModel):
    """Model for file submission to the character jury"""
    filename: str
    content: str
    language: str
    file_type: str = "code"


class JudgeCharacter(BaseModel):
    """Model for judge character response"""
    name: str
    title: str
    avatar: str
    personality: str
    verdict: str
    score: int
    charges: List[str]
    advice: str
    reasoning: str
    emoji: str


class CharacterJuryVerdict(BaseModel):
    """Model for character jury verdict"""
    case_id: str
    overall_score: int
    total_charges: int
    verdict: str
    judges: List[JudgeCharacter]
    recommendations: List[str]
    court_notes: str


# Define the four judge characters
JUDGE_CHARACTERS = {
    "judge_prompting": {
        "name": "Judge Prompting",
        "title": "Prompt Engineering Specialist",
        "avatar": "👨‍💻",
        "personality": "A meticulous prompt engineer who obsesses over clarity and efficiency. Speaks in technical terms but tries to be helpful.",
        "emoji": "📝"
    },
    "judge_database": {
        "name": "Judge Database",
        "title": "Database Optimization Expert", 
        "avatar": "👩‍💼",
        "personality": "A no-nonsense database expert who values performance above all. Gets frustrated by inefficient queries.",
        "emoji": "🗄️"
    },
    "judge_security": {
        "name": "Judge Security",
        "title": "Security & Safety Auditor",
        "avatar": "🛡️",
        "personality": "A paranoid security expert who sees vulnerabilities everywhere. Very protective and cautious.",
        "emoji": "🔒"
    },
    "judge_efficiency": {
        "name": "Judge Efficiency", 
        "title": "Cost & Performance Analyst",
        "avatar": "💰",
        "personality": "A cost-conscious analyst who tracks every token and dollar. Very practical and business-focused.",
        "emoji": "⚡"
    }
}


def get_character_prompt(judge_key: str, file_content: str, filename: str, language: str) -> str:
    """Generate character-specific prompts for each judge"""
    
    character = JUDGE_CHARACTERS[judge_key]
    
    base_prompt = f"""
You are {character['name']}, a {character['title']} in the LLM Court of Code.

PERSONALITY: {character['personality']}

You are evaluating this {language} file: {filename}

FILE CONTENT:
```{language}
{file_content}
```

As {character['name']}, provide your evaluation in this EXACT JSON format:
{{
    "verdict": "GUILTY" or "NOT_GUILTY",
    "score": 1-10,
    "charges": ["specific issue 1", "specific issue 2"],
    "advice": "1-2 lines of specific advice",
    "reasoning": "2-3 sentences explaining your verdict in character"
}}

Stay in character as {character['name']} and focus on your specialty.
"""

    if judge_key == "judge_prompting":
        return base_prompt + """
        Focus on:
        - Prompt clarity and structure
        - System message effectiveness
        - Error handling in prompts
        - Token efficiency
        - Prompt versioning and management
        """
    
    elif judge_key == "judge_database":
        return base_prompt + """
        Focus on:
        - Query optimization and efficiency
        - Connection management and pooling
        - Data modeling and relationships
        - Database security practices
        - Performance bottlenecks
        """
    
    elif judge_key == "judge_security":
        return base_prompt + """
        Focus on:
        - Input validation and sanitization
        - API key and secret management
        - Authentication and authorization
        - Data privacy and protection
        - Common security vulnerabilities
        """
    
    elif judge_key == "judge_efficiency":
        return base_prompt + """
        Focus on:
        - Token usage optimization
        - Model selection appropriateness
        - Caching strategies
        - Response streaming efficiency
        - Cost optimization opportunities
        """
    
    return base_prompt


@router.post("/evaluate-file", response_model=CharacterJuryVerdict)
async def evaluate_file_with_characters(submission: FileSubmission):
    """
    Evaluate a file using character-based judges with controlled outputs.
    """
    try:
        judges_responses = []
        all_charges = []
        total_score = 0
        
        # Get verdict from each judge character
        for judge_key, character_info in JUDGE_CHARACTERS.items():
            try:
                # Generate character-specific prompt
                prompt = get_character_prompt(
                    judge_key, 
                    submission.content, 
                    submission.filename, 
                    submission.language
                )
                
                # Call the LLM (tracked by Opik)
                response = o4_service.call_o4_api(
                    system_prompt=prompt,
                    data=f"Evaluate this {submission.language} file as {character_info['name']}"
                )
                
                # Parse the JSON response
                try:
                    verdict_data = json.loads(response)
                except json.JSONDecodeError:
                    # Fallback if JSON parsing fails
                    verdict_data = {
                        "verdict": "GUILTY",
                        "score": 5,
                        "charges": ["Failed to parse response"],
                        "advice": "Evaluation system error",
                        "reasoning": "Technical error occurred during evaluation"
                    }
                
                # Create judge character response
                judge_character = JudgeCharacter(
                    name=character_info["name"],
                    title=character_info["title"],
                    avatar=character_info["avatar"],
                    personality=character_info["personality"],
                    verdict=verdict_data.get("verdict", "GUILTY"),
                    score=verdict_data.get("score", 5),
                    charges=verdict_data.get("charges", []),
                    advice=verdict_data.get("advice", "No specific advice"),
                    reasoning=verdict_data.get("reasoning", "No reasoning provided"),
                    emoji=character_info["emoji"]
                )
                
                judges_responses.append(judge_character)
                all_charges.extend(verdict_data.get("charges", []))
                total_score += verdict_data.get("score", 5)
                
            except Exception as e:
                # Handle individual judge failures
                error_character = JudgeCharacter(
                    name=character_info["name"],
                    title=character_info["title"],
                    avatar=character_info["avatar"],
                    personality=character_info["personality"],
                    verdict="ERROR",
                    score=0,
                    charges=[f"Judge evaluation failed: {str(e)}"],
                    advice="Unable to evaluate due to technical error",
                    reasoning="System error prevented proper evaluation",
                    emoji=character_info["emoji"]
                )
                judges_responses.append(error_character)
        
        # Calculate overall verdict
        avg_score = total_score / len(JUDGE_CHARACTERS) if JUDGE_CHARACTERS else 0
        overall_verdict = "NOT_GUILTY" if avg_score >= 7 else "GUILTY"
        
        # Generate recommendations
        recommendations = []
        if avg_score < 5:
            recommendations.append("Code requires significant improvements before production")
        elif avg_score < 7:
            recommendations.append("Code has potential but needs refinement")
        else:
            recommendations.append("Code meets professional standards")
        
        if len(all_charges) > 5:
            recommendations.append("Consider addressing multiple issues systematically")
        
        # Generate court notes
        court_notes = f"Case {hash(submission.content) % 10000}: {submission.filename} evaluated by {len(judges_responses)} judges. Overall assessment: {overall_verdict} with {len(all_charges)} total charges."
        
        # Create final verdict
        final_verdict = CharacterJuryVerdict(
            case_id=f"case_{hash(submission.content) % 10000}",
            overall_score=int(avg_score),
            total_charges=len(all_charges),
            verdict=overall_verdict,
            judges=judges_responses,
            recommendations=recommendations,
            court_notes=court_notes
        )
        
        return final_verdict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Character jury evaluation failed: {str(e)}")


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file for evaluation by the character jury.
    """
    try:
        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Determine language from file extension
        filename = file.filename
        if filename.endswith('.py'):
            language = 'python'
        elif filename.endswith('.js'):
            language = 'javascript'
        elif filename.endswith('.ts'):
            language = 'typescript'
        elif filename.endswith('.java'):
            language = 'java'
        elif filename.endswith('.cpp') or filename.endswith('.cc'):
            language = 'cpp'
        else:
            language = 'text'
        
        # Create submission
        submission = FileSubmission(
            filename=filename,
            content=content_str,
            language=language,
            file_type="code"
        )
        
        # Evaluate with character jury
        return await evaluate_file_with_characters(submission)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.get("/test-sample")
async def test_sample_file():
    """Test with the sample database file"""
    try:
        # Read sample file
        sample_path = "/Users/maheenrassell/divhacks-2025/sample_files/database_example.py"
        with open(sample_path, 'r') as f:
            content = f.read()
        
        submission = FileSubmission(
            filename="database_example.py",
            content=content,
            language="python",
            file_type="code"
        )
        
        return await evaluate_file_with_characters(submission)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sample file test failed: {str(e)}")


@router.get("/test-llm-sample")
async def test_llm_sample_file():
    """Test with the sample LLM optimization file"""
    try:
        # Read sample file
        sample_path = "/Users/maheenrassell/divhacks-2025/sample_files/llm_optimization.py"
        with open(sample_path, 'r') as f:
            content = f.read()
        
        submission = FileSubmission(
            filename="llm_optimization.py",
            content=content,
            language="python",
            file_type="code"
        )
        
        return await evaluate_file_with_characters(submission)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM sample file test failed: {str(e)}")


@router.get("/characters")
async def get_judge_characters():
    """Get information about all judge characters"""
    return {"characters": JUDGE_CHARACTERS}
