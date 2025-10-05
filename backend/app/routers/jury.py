"""
LLM Jury System - Court-themed evaluation endpoints

This module provides endpoints for the LLM Jury system where different AI judges
evaluate code submissions and provide court-style verdicts.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.o4_mini_service import OpenAIo4Service
from app.evaluations.jury_evaluations import run_jury_evaluation
import json

router = APIRouter(prefix="/jury", tags=["LLM Jury"])

# Initialize the service (already Opik-tracked)
o4_service = OpenAIo4Service()


class CodeSubmission(BaseModel):
    """Model for code submission to the jury"""
    code: str
    language: str = "python"
    filename: str = "submission.py"
    description: str = ""


class JudgeVerdict(BaseModel):
    """Model for individual judge verdict"""
    judge_name: str
    role: str
    verdict: str
    score: int  # 1-10 scale
    charges: List[str]
    advice: str


class JuryVerdict(BaseModel):
    """Model for final jury verdict"""
    case_id: str
    overall_score: int
    total_charges: int
    verdict: str
    judges: List[JudgeVerdict]
    recommendations: List[str]


# Define the four judges with their specialized roles
JUDGES = {
    "judge_prompting": {
        "name": "Judge Prompting",
        "role": "Prompt Engineering Specialist",
        "description": "Evaluates prompt quality, clarity, and effectiveness"
    },
    "judge_database": {
        "name": "Judge Database", 
        "role": "Database Optimization Expert",
        "description": "Assesses database queries, performance, and efficiency"
    },
    "judge_security": {
        "name": "Judge Security",
        "role": "Security & Safety Auditor", 
        "description": "Reviews code for security vulnerabilities and safety issues"
    },
    "judge_efficiency": {
        "name": "Judge Efficiency",
        "role": "Cost & Performance Analyst",
        "description": "Evaluates model efficiency, token usage, and cost optimization"
    }
}


def get_judge_prompt(judge_key: str, code: str, language: str) -> str:
    """Generate specialized prompts for each judge role"""
    
    base_prompt = f"""
You are {JUDGES[judge_key]['name']}, a {JUDGES[judge_key]['role']} in the LLM Court of Code.

Your task: Evaluate the following {language} code submission and provide a court-style verdict.

Code to evaluate:
```{language}
{code}
```

Provide your verdict in this EXACT JSON format:
{{
    "verdict": "GUILTY" or "NOT GUILTY",
    "score": 1-10,
    "charges": ["specific issue 1", "specific issue 2"],
    "advice": "1-2 lines of specific advice"
}}

Focus on your specialty: {JUDGES[judge_key]['description']}
"""

    if judge_key == "judge_prompting":
        return base_prompt + """
        Evaluate:
        - Prompt clarity and specificity
        - System message effectiveness  
        - User input handling
        - Error handling in prompts
        - Prompt versioning and management
        """
    
    elif judge_key == "judge_database":
        return base_prompt + """
        Evaluate:
        - Database query efficiency
        - Connection management
        - Data modeling and relationships
        - Query optimization opportunities
        - Database security practices
        """
    
    elif judge_key == "judge_security":
        return base_prompt + """
        Evaluate:
        - Input validation and sanitization
        - API key and secret management
        - Authentication and authorization
        - Data privacy and protection
        - Common security vulnerabilities
        """
    
    elif judge_key == "judge_efficiency":
        return base_prompt + """
        Evaluate:
        - Token usage optimization
        - Model selection appropriateness
        - Caching strategies
        - Response streaming efficiency
        - Cost optimization opportunities
        """
    
    return base_prompt


@router.post("/evaluate", response_model=JuryVerdict)
async def evaluate_code(submission: CodeSubmission):
    """
    Submit code to the LLM Jury for evaluation.
    
    Returns a complete court-style verdict with all four judges' assessments.
    """
    try:
        judges_verdicts = []
        all_charges = []
        total_score = 0
        
        # Get verdict from each judge
        for judge_key, judge_info in JUDGES.items():
            try:
                # Generate specialized prompt for this judge
                prompt = get_judge_prompt(judge_key, submission.code, submission.language)
                
                # Call the LLM (this will be tracked by Opik)
                response = o4_service.call_o4_api(
                    system_prompt=prompt,
                    data=f"Evaluate this {submission.language} code submission"
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
                        "advice": "Code evaluation failed - check formatting"
                    }
                
                # Create judge verdict
                judge_verdict = JudgeVerdict(
                    judge_name=judge_info["name"],
                    role=judge_info["role"],
                    verdict=verdict_data.get("verdict", "GUILTY"),
                    score=verdict_data.get("score", 5),
                    charges=verdict_data.get("charges", []),
                    advice=verdict_data.get("advice", "No specific advice provided")
                )
                
                judges_verdicts.append(judge_verdict)
                all_charges.extend(verdict_data.get("charges", []))
                total_score += verdict_data.get("score", 5)
                
            except Exception as e:
                # Handle individual judge failures
                error_verdict = JudgeVerdict(
                    judge_name=judge_info["name"],
                    role=judge_info["role"],
                    verdict="ERROR",
                    score=0,
                    charges=[f"Judge evaluation failed: {str(e)}"],
                    advice="Unable to evaluate due to technical error"
                )
                judges_verdicts.append(error_verdict)
        
        # Calculate overall verdict
        avg_score = total_score / len(JUDGES) if JUDGES else 0
        overall_verdict = "NOT GUILTY" if avg_score >= 7 else "GUILTY"
        
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
        
        # Create final verdict
        final_verdict = JuryVerdict(
            case_id=f"case_{hash(submission.code) % 10000}",
            overall_score=int(avg_score),
            total_charges=len(all_charges),
            verdict=overall_verdict,
            judges=judges_verdicts,
            recommendations=recommendations
        )
        
        return final_verdict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Jury evaluation failed: {str(e)}")


@router.get("/judges")
async def get_judges():
    """Get information about all available judges"""
    return {"judges": JUDGES}


@router.post("/evaluate-opik", response_model=JuryVerdict)
async def evaluate_code_with_opik(submission: CodeSubmission):
    """
    Evaluate code using Opik's evaluation framework.
    
    This endpoint uses Opik's built-in evaluation system instead of
    separate API calls for each judge.
    """
    try:
        # Prepare submission for Opik evaluation
        submission_data = {
            "code": submission.code,
            "language": submission.language,
            "filename": submission.filename,
            "description": submission.description
        }
        
        # Run Opik evaluation (all LLM calls will be tracked by Opik)
        results = run_jury_evaluation([submission_data])
        
        if not results:
            raise HTTPException(status_code=500, detail="No evaluation results returned")
        
        result = results[0]  # Get first (and only) result
        
        # Convert to JuryVerdict format
        judges = []
        for eval_type, eval_data in result["evaluations"].items():
            judge_name = {
                "prompting": "Judge Prompting",
                "database": "Judge Database", 
                "security": "Judge Security",
                "efficiency": "Judge Efficiency"
            }.get(eval_type, f"Judge {eval_type.title()}")
            
            role = {
                "prompting": "Prompt Engineering Specialist",
                "database": "Database Optimization Expert",
                "security": "Security & Safety Auditor", 
                "efficiency": "Cost & Performance Analyst"
            }.get(eval_type, "Code Evaluator")
            
            verdict = "NOT GUILTY" if eval_data["verdict"] in ["GOOD", "OPTIMIZED", "SECURE", "EFFICIENT"] else "GUILTY"
            
            judge_verdict = JudgeVerdict(
                judge_name=judge_name,
                role=role,
                verdict=verdict,
                score=eval_data["score"],
                charges=eval_data.get("issues", []),
                advice=eval_data.get("advice", "No specific advice")
            )
            judges.append(judge_verdict)
        
        # Generate recommendations
        recommendations = []
        if result["overall_score"] < 5:
            recommendations.append("Code requires significant improvements before production")
        elif result["overall_score"] < 7:
            recommendations.append("Code has potential but needs refinement")
        else:
            recommendations.append("Code meets professional standards")
        
        if result["total_issues"] > 5:
            recommendations.append("Consider addressing multiple issues systematically")
        
        # Create final verdict
        final_verdict = JuryVerdict(
            case_id=f"opik_case_{hash(submission.code) % 10000}",
            overall_score=result["overall_score"],
            total_charges=result["total_issues"],
            verdict=result["overall_verdict"],
            judges=judges,
            recommendations=recommendations
        )
        
        return final_verdict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Opik evaluation failed: {str(e)}")


@router.get("/test")
async def test_jury():
    """Test endpoint to verify jury system is working"""
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
    
    return await evaluate_code(submission)


@router.get("/test-opik")
async def test_jury_opik():
    """Test endpoint for Opik evaluation system"""
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
    
    return await evaluate_code_with_opik(submission)
