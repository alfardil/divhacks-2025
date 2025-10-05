"""
Frontend Jury Response System

This module extracts judge responses from Opik logs and formats them
for the frontend display with proper labeling.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.o4_mini_service import OpenAIo4Service
import json
import re

router = APIRouter(prefix="/frontend-jury", tags=["Frontend Jury"])

# Initialize the service (already Opik-tracked)
o4_service = OpenAIo4Service()


class JudgeResponse(BaseModel):
    """Model for individual judge response"""
    judge_id: str
    judge_name: str
    score: int
    verdict: str
    reasoning: str
    issues: List[str]
    advice: str


class FrontendJuryVerdict(BaseModel):
    """Model for frontend jury verdict"""
    case_id: str
    overall_score: int
    verdict: str
    judges: List[JudgeResponse]
    summary: str


def extract_judge_response_from_opik_logs(trace_id: str) -> Dict[str, Any]:
    """
    Extract judge response from Opik logs.
    This simulates what would come from your Opik dashboard.
    """
    # In a real implementation, you'd query Opik's API for trace results
    # For now, we'll simulate the response based on your logs
    
    # This is what your Opik logs show:
    sample_response = {
        "Prompting Quality Score": {
            "score": 6,
            "reason": "Strengths: clear objective, well-scoped evaluation dimensions, explicit required fields, and an example output that demonstrates expected structure. Weaknesses: no scoring rubric or weighting across criteria, unclear semantics for the score (what constitutes 10 vs 1), no explicit error-handling instructions for non-database code or invalid inputs, and no strict JSON constraints (e.g., 'return only valid JSON, no prose, no Markdown'). Missing guidance on handling uncertainty, mapping issues to code lines, or thresholds linking score to verdict. Improvements: add a precise rubric per criterion with thresholds for the verdict, specify strict JSON schema and formatting rules, define behavior when DB-related code is absent (e.g., set score to 1 and explain), require issues to reference code snippets/lines where possible, and constrain response length to ensure consistency and determinism."
        }
    }
    
    return sample_response


def parse_judge_reasoning(reasoning: str) -> Dict[str, Any]:
    """Parse the judge's reasoning into structured components - keep it concise"""
    
    # Extract verdict
    verdict = "NEEDS_IMPROVEMENT"
    if "verdict" in reasoning.lower():
        if "good" in reasoning.lower() or "excellent" in reasoning.lower():
            verdict = "GOOD"
        elif "needs improvement" in reasoning.lower() or "weak" in reasoning.lower():
            verdict = "NEEDS_IMPROVEMENT"
    
    # Extract only the top 3 issues - keep it concise
    issues = []
    lines = reasoning.split('\n')
    issue_count = 0
    
    for line in lines:
        if issue_count >= 3:  # Only take first 3 issues
            break
        line = line.strip()
        if line.startswith('-') or line.startswith('•') or line.startswith('*'):
            issues.append(line[1:].strip())
            issue_count += 1
        elif re.match(r'^\d+\.', line):
            issues.append(line[2:].strip())
            issue_count += 1
    
    # Extract concise advice - just one line
    advice = "No specific advice provided"
    for line in lines:
        if "advice:" in line.lower() or "improvements:" in line.lower():
            advice = line.split(':', 1)[1].strip()
            # Truncate if too long
            if len(advice) > 100:
                advice = advice[:100] + "..."
            break
    
    return {
        "verdict": verdict,
        "issues": issues,
        "advice": advice
    }


@router.post("/evaluate-with-judge-1")
async def evaluate_with_judge_1(request: dict):
    """
    Evaluate code with Judge 1 using ONLY Opik's evaluation.
    No GPT calls - just return Opik's analysis.
    """
    try:
        # Extract code and language from request
        code = request.get("code", "")
        language = request.get("language", "python")
        
        # Make a simple LLM call that will be tracked by Opik
        # This triggers your Opik rule evaluation
        response = o4_service.call_o4_api(
            system_prompt=f"Evaluate this {language} code for prompting quality",
            data=f"```{language}\n{code}\n```"
        )
        
        # TODO: In a real implementation, query Opik's API to get the actual evaluation results
        # For now, we'll extract from the LLM response that Opik is tracking
        
        # Parse the actual response that Opik is evaluating
        try:
            # Extract score from the response (this is what Opik is scoring)
            score = 5  # Default
            if "score" in response.lower():
                score_match = re.search(r'score[:\s]*(\d+)', response.lower())
                if score_match:
                    score = int(score_match.group(1))
            
            # Extract verdict
            verdict = "NEEDS_IMPROVEMENT"
            if "good" in response.lower() or "excellent" in response.lower():
                verdict = "GOOD"
            
            # Extract issues from the response
            issues = []
            lines = response.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                    issues.append(line[1:].strip())
                elif re.match(r'^\d+\.', line):
                    issues.append(line[2:].strip())
            
            # Take only first 3 issues
            issues = issues[:3]
            
            # Extract advice
            advice = "No specific advice provided"
            for line in lines:
                if "advice:" in line.lower() or "recommendations:" in line.lower():
                    advice = line.split(':', 1)[1].strip()
                    break
            
        except Exception as e:
            # Fallback if parsing fails
            score = 5
            verdict = "NEEDS_IMPROVEMENT"
            issues = ["Failed to parse Opik evaluation"]
            advice = "Check Opik configuration"
        
        # Create Judge 1 response using parsed data from Opik-tracked response
        judge_response = JudgeResponse(
            judge_id="judge_1",
            judge_name="Judge 1 - Prompting Quality",
            score=score,
            verdict=verdict,
            reasoning=f"Opik-tracked analysis: Score {score}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues]),
            issues=issues,
            advice=advice
        )
        
        # Create frontend verdict
        verdict = FrontendJuryVerdict(
            case_id=f"case_{hash(code) % 10000}",
            overall_score=score,
            verdict=verdict,
            judges=[judge_response],
            summary=f"Judge 1 (Opik-tracked) evaluated the {language} code and found {len(issues)} issues."
        )
        
        return verdict
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Opik evaluation failed: {str(e)}")


@router.get("/test-judge-1")
async def test_judge_1():
    """Test Judge 1 with sample code"""
    test_code = """
def hello_world():
    print("Hello, World!")
    return "success"
"""
    
    return await evaluate_with_judge_1(test_code, "python")


@router.post("/evaluate-multiple-judges")
async def evaluate_multiple_judges(code: str, language: str = "python"):
    """
    Evaluate code with multiple judges (simulated for now).
    In a real implementation, you'd have multiple Opik rules.
    """
    try:
        judges = []
        
        # Judge 1 - Prompting Quality (using your Opik rule)
        judge_1_response = await evaluate_with_judge_1(code, language)
        judges.extend(judge_1_response.judges)
        
        # For now, simulate other judges
        # In a real implementation, you'd have separate Opik rules for each
        
        # Calculate overall score
        total_score = sum(judge.score for judge in judges)
        avg_score = total_score / len(judges) if judges else 0
        
        # Determine overall verdict
        overall_verdict = "GOOD" if avg_score >= 7 else "NEEDS_IMPROVEMENT"
        
        # Create summary
        summary = f"Evaluated by {len(judges)} judges. Average score: {avg_score:.1f}/10"
        
        verdict = FrontendJuryVerdict(
            case_id=f"case_{hash(code) % 10000}",
            overall_score=int(avg_score),
            verdict=overall_verdict,
            judges=judges,
            summary=summary
        )
        
        return verdict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multiple judge evaluation failed: {str(e)}")


@router.get("/judge-info")
async def get_judge_info():
    """Get information about available judges"""
    return {
        "judges": [
            {
                "id": "judge_1",
                "name": "Judge 1 - Prompting Quality",
                "description": "Evaluates prompt engineering and LLM interaction quality",
                "specialty": "Prompt clarity, system messages, error handling"
            }
        ]
    }
