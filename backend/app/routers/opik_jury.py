"""
Real Opik Rules Integration for LLM Jury System

This module integrates with Opik's evaluation rules system
to provide structured code evaluation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.o4_mini_service import OpenAIo4Service
import json

router = APIRouter(prefix="/opik-jury", tags=["Opik Jury Rules"])

# Initialize the service (already Opik-tracked)
o4_service = OpenAIo4Service()


class CodeSubmission(BaseModel):
    """Model for code submission to the jury"""
    code: str
    language: str = "python"
    filename: str = "submission.py"
    description: str = ""


class OpikEvaluationResult(BaseModel):
    """Model for Opik evaluation result"""
    rule_name: str
    score: float
    verdict: str
    feedback: str
    metadata: Dict[str, Any] = {}


@router.post("/evaluate-single")
async def evaluate_with_single_rule(submission: CodeSubmission):
    """
    Test a single Opik rule evaluation.
    
    This endpoint will make an LLM call that gets evaluated by your
    Opik rule, and return the evaluation result.
    """
    try:
        # Create a prompt that will be evaluated by your Opik rule
        evaluation_prompt = f"""
        Evaluate this {submission.language} code:
        
        ```{submission.language}
        {submission.code}
        ```
        
        Please provide a detailed analysis including:
        1. Quality assessment
        2. Specific issues found
        3. Improvement recommendations
        4. Overall score (1-10)
        """
        
        # Make the LLM call (this will be tracked by Opik and evaluated by your rule)
        response = o4_service.call_o4_api(
            system_prompt=evaluation_prompt,
            data=f"Evaluate this {submission.language} code submission"
        )
        
        # Parse the response to extract evaluation details
        try:
            # Try to extract score from response
            score = 5  # Default score
            if "score" in response.lower():
                # Look for score patterns in the response
                import re
                score_match = re.search(r'score[:\s]*(\d+)', response.lower())
                if score_match:
                    score = int(score_match.group(1))
            
            # Determine verdict based on score
            verdict = "GOOD" if score >= 7 else "NEEDS_IMPROVEMENT"
            
            result = OpikEvaluationResult(
                rule_name="Code Quality Evaluation",
                score=score,
                verdict=verdict,
                feedback=response,
                metadata={
                    "language": submission.language,
                    "filename": submission.filename,
                    "code_length": len(submission.code)
                }
            )
            
            return result
            
        except Exception as e:
            # Fallback if parsing fails
            result = OpikEvaluationResult(
                rule_name="Code Quality Evaluation",
                score=5,
                verdict="EVALUATION_ERROR",
                feedback=f"Evaluation completed but parsing failed: {str(e)}",
                metadata={
                    "language": submission.language,
                    "filename": submission.filename,
                    "error": str(e)
                }
            )
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/test-single")
async def test_single_rule():
    """Test endpoint for single Opik rule evaluation"""
    test_code = """
def hello_world():
    print("Hello, World!")
    return "success"
"""
    
    submission = CodeSubmission(
        code=test_code,
        language="python",
        filename="test.py",
        description="Simple test function"
    )
    
    return await evaluate_with_single_rule(submission)


@router.get("/test-multiple")
async def test_multiple_rules():
    """Test multiple code samples with your Opik rule"""
    test_cases = [
        {
            "code": "def hello_world():\n    print('Hello, World!')\n    return 'success'",
            "language": "python",
            "filename": "simple.py",
            "description": "Simple function"
        },
        {
            "code": "def bad_function():\n    # No docstring\n    x = 1/0  # Division by zero\n    return x",
            "language": "python", 
            "filename": "bad.py",
            "description": "Function with issues"
        },
        {
            "code": "def good_function():\n    \"\"\"A well-documented function.\"\"\"\n    try:\n        result = 42\n        return result\n    except Exception as e:\n        print(f'Error: {e}')\n        return None",
            "language": "python",
            "filename": "good.py", 
            "description": "Well-written function"
        }
    ]
    
    results = []
    for test_case in test_cases:
        submission = CodeSubmission(**test_case)
        result = await evaluate_with_single_rule(submission)
        results.append({
            "test_case": test_case,
            "evaluation": result
        })
    
    return {"results": results}
