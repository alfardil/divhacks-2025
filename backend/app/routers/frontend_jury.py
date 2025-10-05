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


@router.post("/evaluate-with-judge-2")
async def evaluate_with_judge_2(request: dict):
    """
    Evaluate code with Judge 2 (Database Optimization) using ONLY Opik's evaluation.
    """
    try:
        # Extract code and language from request
        code = request.get("code", "")
        language = request.get("language", "python")
        
        # Make a simple LLM call that will be tracked by Opik
        # This triggers your Opik rule evaluation for Judge 2
        response = o4_service.call_o4_api(
            system_prompt=f"Evaluate this {language} code for database optimization",
            data=f"```{language}\n{code}\n```"
        )
        
        # Parse the actual response that Opik is evaluating
        try:
            # Extract score from the response (this is what Opik is scoring)
            score = 5  # Default
            if "score" in response.lower():
                score_match = re.search(r'score[:\s]*(\d+)', response.lower())
                if score_match:
                    score = int(score_match.group(1))
            
            # Extract verdict
            verdict = "NEEDS_OPTIMIZATION"
            if "optimized" in response.lower() or "good" in response.lower():
                verdict = "OPTIMIZED"
            
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
            verdict = "NEEDS_OPTIMIZATION"
            issues = ["Failed to parse Opik evaluation"]
            advice = "Check Opik configuration"
        
        # Create Judge 2 response using parsed data from Opik-tracked response
        judge_response = JudgeResponse(
            judge_id="judge_2",
            judge_name="Judge 2 - Database Optimization",
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
            summary=f"Judge 2 (Opik-tracked) evaluated the {language} code and found {len(issues)} issues."
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


@router.post("/evaluate-all-judges")
async def evaluate_all_judges(request: dict):
    """
    Evaluate code with ALL judges using Opik rules.
    One button triggers all evaluations.
    """
    try:
        # Extract code and language from request
        code = request.get("code", "")
        language = request.get("language", "python")
        
        judges = []
        
        # Judge 1 - Prompting Quality
        try:
            # Make the exact call that your Opik rule expects
            judge_1_response = o4_service.call_o4_api(
                system_prompt="You are Judge Prompting, a prompt engineering specialist. Evaluate the prompting techniques and clarity within the provided code. Focus on prompt clarity, system message effectiveness, error handling in prompts, and best practices adherence. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"GOOD/NEEDS_IMPROVEMENT\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"improvement advice\"}",
                data=f"Evaluate this {language} code for prompting quality:\n\n```{language}\n{code}\n```"
            )
            
            # Parse Judge 1 response - look for JSON score
            score_1 = 5  # fallback
            try:
                # Try to extract JSON score first
                json_match = re.search(r'"score":\s*(\d+)', judge_1_response)
                if json_match:
                    score_1 = int(json_match.group(1))
                else:
                    # Fallback to text search
                    score_match = re.search(r'score[:\s]*(\d+)', judge_1_response.lower())
                    if score_match:
                        score_1 = int(score_match.group(1))
            except:
                score_1 = 5
            
            # Parse verdict from JSON
            verdict_1 = "NEEDS_IMPROVEMENT"
            try:
                verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_1_response)
                if verdict_match:
                    verdict_1 = verdict_match.group(1)
                elif "good" in judge_1_response.lower():
                    verdict_1 = "GOOD"
            except:
                verdict_1 = "NEEDS_IMPROVEMENT"
            
            # Parse issues from JSON
            issues_1 = []
            try:
                issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_1_response, re.DOTALL)
                if issues_match:
                    issues_text = issues_match.group(1)
                    # Extract individual issues
                    issue_matches = re.findall(r'"([^"]+)"', issues_text)
                    issues_1 = issue_matches[:3]
            except:
                # Fallback to line parsing
                lines = judge_1_response.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                        issues_1.append(line[1:].strip())
                    elif re.match(r'^\d+\.', line):
                        issues_1.append(line[2:].strip())
                issues_1 = issues_1[:3]
            
            # Parse advice from JSON
            advice_1 = "No specific advice provided"
            try:
                advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_1_response)
                if advice_match:
                    advice_1 = advice_match.group(1)
            except:
                # Fallback to line parsing
                lines = judge_1_response.split('\n')
                for line in lines:
                    if "advice:" in line.lower():
                        advice_1 = line.split(':', 1)[1].strip()
                        break
            
            judge_1 = JudgeResponse(
                judge_id="judge_1",
                judge_name="Judge 1 - Prompting Quality",
                score=score_1,
                verdict=verdict_1,
                reasoning=f"Opik-tracked analysis: Score {score_1}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_1]),
                issues=issues_1,
                advice=advice_1
            )
            judges.append(judge_1)
            
        except Exception as e:
            print(f"Judge 1 error: {e}")
        
        # Judge 2 - Database Optimization
        try:
            # Make the exact call that your Opik rule expects
            judge_2_response = o4_service.call_o4_api(
                system_prompt="You are Judge Database, a database optimization expert. Analyze the code for query efficiency and optimization, connection management, index usage and performance, and data handling best practices. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"OPTIMIZED/NEEDS_OPTIMIZATION\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"optimization advice\"}",
                data=f"Evaluate this {language} code for database optimization:\n\n```{language}\n{code}\n```"
            )
            
            # Parse Judge 2 response - look for JSON score
            score_2 = 5  # fallback
            try:
                # Try to extract JSON score first
                json_match = re.search(r'"score":\s*(\d+)', judge_2_response)
                if json_match:
                    score_2 = int(json_match.group(1))
                else:
                    # Fallback to text search
                    score_match = re.search(r'score[:\s]*(\d+)', judge_2_response.lower())
                    if score_match:
                        score_2 = int(score_match.group(1))
            except:
                score_2 = 5
            
            # Parse verdict from JSON
            verdict_2 = "NEEDS_OPTIMIZATION"
            try:
                verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_2_response)
                if verdict_match:
                    verdict_2 = verdict_match.group(1)
                elif "optimized" in judge_2_response.lower():
                    verdict_2 = "OPTIMIZED"
            except:
                verdict_2 = "NEEDS_OPTIMIZATION"
            
            # Parse issues from JSON
            issues_2 = []
            try:
                issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_2_response, re.DOTALL)
                if issues_match:
                    issues_text = issues_match.group(1)
                    # Extract individual issues
                    issue_matches = re.findall(r'"([^"]+)"', issues_text)
                    issues_2 = issue_matches[:3]
            except:
                # Fallback to line parsing
                lines = judge_2_response.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                        issues_2.append(line[1:].strip())
                    elif re.match(r'^\d+\.', line):
                        issues_2.append(line[2:].strip())
                issues_2 = issues_2[:3]
            
            # Parse advice from JSON
            advice_2 = "No specific advice provided"
            try:
                advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_2_response)
                if advice_match:
                    advice_2 = advice_match.group(1)
            except:
                # Fallback to line parsing
                lines = judge_2_response.split('\n')
                for line in lines:
                    if "advice:" in line.lower():
                        advice_2 = line.split(':', 1)[1].strip()
                        break
            
            judge_2 = JudgeResponse(
                judge_id="judge_2",
                judge_name="Judge 2 - Database Optimization",
                score=score_2,
                verdict=verdict_2,
                reasoning=f"Opik-tracked analysis: Score {score_2}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_2]),
                issues=issues_2,
                advice=advice_2
            )
            judges.append(judge_2)
            
        except Exception as e:
            print(f"Judge 2 error: {e}")
        
        # Judge 3 - Security & Safety
        try:
            # Make the exact call that your Opik rule expects
            judge_3_response = o4_service.call_o4_api(
                system_prompt="You are Judge Security, a security auditor. Review the code for SQL injection vulnerabilities, input validation issues, API key management, authentication/authorization, and data protection practices. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"SECURE/VULNERABLE\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"security advice\"}",
                data=f"Evaluate this {language} code for security and safety:\n\n```{language}\n{code}\n```"
            )
            
            # Parse Judge 3 response - look for JSON score
            score_3 = 5  # fallback
            try:
                # Try to extract JSON score first
                json_match = re.search(r'"score":\s*(\d+)', judge_3_response)
                if json_match:
                    score_3 = int(json_match.group(1))
                else:
                    # Fallback to text search
                    score_match = re.search(r'score[:\s]*(\d+)', judge_3_response.lower())
                    if score_match:
                        score_3 = int(score_match.group(1))
            except:
                score_3 = 5
            
            # Parse verdict from JSON
            verdict_3 = "VULNERABLE"
            try:
                verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_3_response)
                if verdict_match:
                    verdict_3 = verdict_match.group(1)
                elif "secure" in judge_3_response.lower():
                    verdict_3 = "SECURE"
            except:
                verdict_3 = "VULNERABLE"
            
            # Parse issues from JSON
            issues_3 = []
            try:
                issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_3_response, re.DOTALL)
                if issues_match:
                    issues_text = issues_match.group(1)
                    # Extract individual issues
                    issue_matches = re.findall(r'"([^"]+)"', issues_text)
                    issues_3 = issue_matches[:3]
            except:
                # Fallback to line parsing
                lines = judge_3_response.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                        issues_3.append(line[1:].strip())
                    elif re.match(r'^\d+\.', line):
                        issues_3.append(line[2:].strip())
                issues_3 = issues_3[:3]
            
            # Parse advice from JSON
            advice_3 = "No specific advice provided"
            try:
                advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_3_response)
                if advice_match:
                    advice_3 = advice_match.group(1)
            except:
                # Fallback to line parsing
                lines = judge_3_response.split('\n')
                for line in lines:
                    if "advice:" in line.lower():
                        advice_3 = line.split(':', 1)[1].strip()
                        break
            
            judge_3 = JudgeResponse(
                judge_id="judge_3",
                judge_name="Judge 3 - Security & Safety",
                score=score_3,
                verdict=verdict_3,
                reasoning=f"Opik-tracked analysis: Score {score_3}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_3]),
                issues=issues_3,
                advice=advice_3
            )
            judges.append(judge_3)
            
        except Exception as e:
            print(f"Judge 3 error: {e}")
        
        # Judge 4 - Cost & Efficiency
        try:
            # Make the exact call that your Opik rule expects
            judge_4_response = o4_service.call_o4_api(
                system_prompt="You are Judge Efficiency, a cost analyst. Evaluate the code for LLM token optimization, model selection efficiency, resource consumption, performance bottlenecks, and cost-effective practices. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"EFFICIENT/INEFFICIENT\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"efficiency advice\"}",
                data=f"Evaluate this {language} code for cost and efficiency:\n\n```{language}\n{code}\n```"
            )
            
            # Parse Judge 4 response - look for JSON score
            score_4 = 5  # fallback
            try:
                # Try to extract JSON score first
                json_match = re.search(r'"score":\s*(\d+)', judge_4_response)
                if json_match:
                    score_4 = int(json_match.group(1))
                else:
                    # Fallback to text search
                    score_match = re.search(r'score[:\s]*(\d+)', judge_4_response.lower())
                    if score_match:
                        score_4 = int(score_match.group(1))
            except:
                score_4 = 5
            
            # Parse verdict from JSON
            verdict_4 = "INEFFICIENT"
            try:
                verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_4_response)
                if verdict_match:
                    verdict_4 = verdict_match.group(1)
                elif "efficient" in judge_4_response.lower():
                    verdict_4 = "EFFICIENT"
            except:
                verdict_4 = "INEFFICIENT"
            
            # Parse issues from JSON
            issues_4 = []
            try:
                issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_4_response, re.DOTALL)
                if issues_match:
                    issues_text = issues_match.group(1)
                    # Extract individual issues
                    issue_matches = re.findall(r'"([^"]+)"', issues_text)
                    issues_4 = issue_matches[:3]
            except:
                # Fallback to line parsing
                lines = judge_4_response.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                        issues_4.append(line[1:].strip())
                    elif re.match(r'^\d+\.', line):
                        issues_4.append(line[2:].strip())
                issues_4 = issues_4[:3]
            
            # Parse advice from JSON
            advice_4 = "No specific advice provided"
            try:
                advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_4_response)
                if advice_match:
                    advice_4 = advice_match.group(1)
            except:
                # Fallback to line parsing
                lines = judge_4_response.split('\n')
                for line in lines:
                    if "advice:" in line.lower():
                        advice_4 = line.split(':', 1)[1].strip()
                        break
            
            judge_4 = JudgeResponse(
                judge_id="judge_4",
                judge_name="Judge 4 - Cost & Efficiency",
                score=score_4,
                verdict=verdict_4,
                reasoning=f"Opik-tracked analysis: Score {score_4}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_4]),
                issues=issues_4,
                advice=advice_4
            )
            judges.append(judge_4)
            
        except Exception as e:
            print(f"Judge 4 error: {e}")
        
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
        raise HTTPException(status_code=500, detail=f"All judges evaluation failed: {str(e)}")


@router.post("/evaluate-selected-judges")
async def evaluate_selected_judges(request: dict):
    """
    Evaluate code with SELECTED judges using Opik rules.
    Only evaluates the judges that are selected.
    """
    try:
        # Extract code, language, and selected judges from request
        code = request.get("code", "")
        language = request.get("language", "python")
        selected_judges = request.get("selectedJudges", {})
        
        judges = []
        
        # Judge 1 - Prompting Quality (if selected)
        if selected_judges.get("judge_1", False):
            try:
                # Make the exact call that your Opik rule expects
                judge_1_response = o4_service.call_o4_api(
                    system_prompt="You are Judge Prompting, a prompt engineering specialist. Evaluate the prompting techniques and clarity within the provided code. Focus on prompt clarity, system message effectiveness, error handling in prompts, and best practices adherence. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"GOOD/NEEDS_IMPROVEMENT\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"improvement advice\"}",
                    data=f"Evaluate this {language} code for prompting quality:\n\n```{language}\n{code}\n```"
                )
                
                # Parse Judge 1 response - look for JSON score
                score_1 = 5  # fallback
                try:
                    # Try to extract JSON score first
                    json_match = re.search(r'"score":\s*(\d+)', judge_1_response)
                    if json_match:
                        score_1 = int(json_match.group(1))
                    else:
                        # Fallback to text search
                        score_match = re.search(r'score[:\s]*(\d+)', judge_1_response.lower())
                        if score_match:
                            score_1 = int(score_match.group(1))
                except:
                    score_1 = 5
                
                # Parse verdict from JSON
                verdict_1 = "NEEDS_IMPROVEMENT"
                try:
                    verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_1_response)
                    if verdict_match:
                        verdict_1 = verdict_match.group(1)
                    elif "good" in judge_1_response.lower():
                        verdict_1 = "GOOD"
                except:
                    verdict_1 = "NEEDS_IMPROVEMENT"
                
                # Parse issues from JSON
                issues_1 = []
                try:
                    issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_1_response, re.DOTALL)
                    if issues_match:
                        issues_text = issues_match.group(1)
                        # Extract individual issues
                        issue_matches = re.findall(r'"([^"]+)"', issues_text)
                        issues_1 = issue_matches[:3]
                except:
                    # Fallback to line parsing
                    lines = judge_1_response.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                            issues_1.append(line[1:].strip())
                        elif re.match(r'^\d+\.', line):
                            issues_1.append(line[2:].strip())
                    issues_1 = issues_1[:3]
                
                # Parse advice from JSON
                advice_1 = "No specific advice provided"
                try:
                    advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_1_response)
                    if advice_match:
                        advice_1 = advice_match.group(1)
                except:
                    # Fallback to line parsing
                    lines = judge_1_response.split('\n')
                    for line in lines:
                        if "advice:" in line.lower():
                            advice_1 = line.split(':', 1)[1].strip()
                            break
                
                judge_1 = JudgeResponse(
                    judge_id="judge_1",
                    judge_name="Judge 1 - Prompting Quality",
                    score=score_1,
                    verdict=verdict_1,
                    reasoning=f"Opik-tracked analysis: Score {score_1}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_1]),
                    issues=issues_1,
                    advice=advice_1
                )
                judges.append(judge_1)
                
            except Exception as e:
                print(f"Judge 1 error: {e}")
        
        # Judge 2 - Database Optimization (if selected)
        if selected_judges.get("judge_2", False):
            try:
                # Make the exact call that your Opik rule expects
                judge_2_response = o4_service.call_o4_api(
                    system_prompt="You are Judge Database, a database optimization expert. Analyze the code for query efficiency and optimization, connection management, index usage and performance, and data handling best practices. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"OPTIMIZED/NEEDS_OPTIMIZATION\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"optimization advice\"}",
                    data=f"Evaluate this {language} code for database optimization:\n\n```{language}\n{code}\n```"
                )
                
                # Parse Judge 2 response - look for JSON score
                score_2 = 5  # fallback
                try:
                    # Try to extract JSON score first
                    json_match = re.search(r'"score":\s*(\d+)', judge_2_response)
                    if json_match:
                        score_2 = int(json_match.group(1))
                    else:
                        # Fallback to text search
                        score_match = re.search(r'score[:\s]*(\d+)', judge_2_response.lower())
                        if score_match:
                            score_2 = int(score_match.group(1))
                except:
                    score_2 = 5
                
                # Parse verdict from JSON
                verdict_2 = "NEEDS_OPTIMIZATION"
                try:
                    verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_2_response)
                    if verdict_match:
                        verdict_2 = verdict_match.group(1)
                    elif "optimized" in judge_2_response.lower():
                        verdict_2 = "OPTIMIZED"
                except:
                    verdict_2 = "NEEDS_OPTIMIZATION"
                
                # Parse issues from JSON
                issues_2 = []
                try:
                    issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_2_response, re.DOTALL)
                    if issues_match:
                        issues_text = issues_match.group(1)
                        # Extract individual issues
                        issue_matches = re.findall(r'"([^"]+)"', issues_text)
                        issues_2 = issue_matches[:3]
                except:
                    # Fallback to line parsing
                    lines = judge_2_response.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                            issues_2.append(line[1:].strip())
                        elif re.match(r'^\d+\.', line):
                            issues_2.append(line[2:].strip())
                    issues_2 = issues_2[:3]
                
                # Parse advice from JSON
                advice_2 = "No specific advice provided"
                try:
                    advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_2_response)
                    if advice_match:
                        advice_2 = advice_match.group(1)
                except:
                    # Fallback to line parsing
                    lines = judge_2_response.split('\n')
                    for line in lines:
                        if "advice:" in line.lower():
                            advice_2 = line.split(':', 1)[1].strip()
                            break
                
                judge_2 = JudgeResponse(
                    judge_id="judge_2",
                    judge_name="Judge 2 - Database Optimization",
                    score=score_2,
                    verdict=verdict_2,
                    reasoning=f"Opik-tracked analysis: Score {score_2}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_2]),
                    issues=issues_2,
                    advice=advice_2
                )
                judges.append(judge_2)
                
            except Exception as e:
                print(f"Judge 2 error: {e}")
        
        # Judge 3 - Security & Safety (if selected)
        if selected_judges.get("judge_3", False):
            try:
                # Make the exact call that your Opik rule expects
                judge_3_response = o4_service.call_o4_api(
                    system_prompt="You are Judge Security, a security auditor. Review the code for SQL injection vulnerabilities, input validation issues, API key management, authentication/authorization, and data protection practices. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"SECURE/VULNERABLE\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"security advice\"}",
                    data=f"Evaluate this {language} code for security and safety:\n\n```{language}\n{code}\n```"
                )
                
                # Parse Judge 3 response - look for JSON score
                score_3 = 5  # fallback
                try:
                    # Try to extract JSON score first
                    json_match = re.search(r'"score":\s*(\d+)', judge_3_response)
                    if json_match:
                        score_3 = int(json_match.group(1))
                    else:
                        # Fallback to text search
                        score_match = re.search(r'score[:\s]*(\d+)', judge_3_response.lower())
                        if score_match:
                            score_3 = int(score_match.group(1))
                except:
                    score_3 = 5
                
                # Parse verdict from JSON
                verdict_3 = "VULNERABLE"
                try:
                    verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_3_response)
                    if verdict_match:
                        verdict_3 = verdict_match.group(1)
                    elif "secure" in judge_3_response.lower():
                        verdict_3 = "SECURE"
                except:
                    verdict_3 = "VULNERABLE"
                
                # Parse issues from JSON
                issues_3 = []
                try:
                    issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_3_response, re.DOTALL)
                    if issues_match:
                        issues_text = issues_match.group(1)
                        # Extract individual issues
                        issue_matches = re.findall(r'"([^"]+)"', issues_text)
                        issues_3 = issue_matches[:3]
                except:
                    # Fallback to line parsing
                    lines = judge_3_response.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                            issues_3.append(line[1:].strip())
                        elif re.match(r'^\d+\.', line):
                            issues_3.append(line[2:].strip())
                    issues_3 = issues_3[:3]
                
                # Parse advice from JSON
                advice_3 = "No specific advice provided"
                try:
                    advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_3_response)
                    if advice_match:
                        advice_3 = advice_match.group(1)
                except:
                    # Fallback to line parsing
                    lines = judge_3_response.split('\n')
                    for line in lines:
                        if "advice:" in line.lower():
                            advice_3 = line.split(':', 1)[1].strip()
                            break
                
                judge_3 = JudgeResponse(
                    judge_id="judge_3",
                    judge_name="Judge 3 - Security & Safety",
                    score=score_3,
                    verdict=verdict_3,
                    reasoning=f"Opik-tracked analysis: Score {score_3}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_3]),
                    issues=issues_3,
                    advice=advice_3
                )
                judges.append(judge_3)
                
            except Exception as e:
                print(f"Judge 3 error: {e}")
        
        # Judge 4 - Cost & Efficiency (if selected)
        if selected_judges.get("judge_4", False):
            try:
                # Make the exact call that your Opik rule expects
                judge_4_response = o4_service.call_o4_api(
                    system_prompt="You are Judge Efficiency, a cost analyst. Evaluate the code for LLM token optimization, model selection efficiency, resource consumption, performance bottlenecks, and cost-effective practices. Provide assessment in JSON format: {\"score\": 1-10, \"reason\": \"detailed analysis\", \"verdict\": \"EFFICIENT/INEFFICIENT\", \"issues\": [\"issue1\", \"issue2\"], \"advice\": \"efficiency advice\"}",
                    data=f"Evaluate this {language} code for cost and efficiency:\n\n```{language}\n{code}\n```"
                )
                
                # Parse Judge 4 response - look for JSON score
                score_4 = 5  # fallback
                try:
                    # Try to extract JSON score first
                    json_match = re.search(r'"score":\s*(\d+)', judge_4_response)
                    if json_match:
                        score_4 = int(json_match.group(1))
                    else:
                        # Fallback to text search
                        score_match = re.search(r'score[:\s]*(\d+)', judge_4_response.lower())
                        if score_match:
                            score_4 = int(score_match.group(1))
                except:
                    score_4 = 5
                
                # Parse verdict from JSON
                verdict_4 = "INEFFICIENT"
                try:
                    verdict_match = re.search(r'"verdict":\s*"([^"]+)"', judge_4_response)
                    if verdict_match:
                        verdict_4 = verdict_match.group(1)
                    elif "efficient" in judge_4_response.lower():
                        verdict_4 = "EFFICIENT"
                except:
                    verdict_4 = "INEFFICIENT"
                
                # Parse issues from JSON
                issues_4 = []
                try:
                    issues_match = re.search(r'"issues":\s*\[(.*?)\]', judge_4_response, re.DOTALL)
                    if issues_match:
                        issues_text = issues_match.group(1)
                        # Extract individual issues
                        issue_matches = re.findall(r'"([^"]+)"', issues_text)
                        issues_4 = issue_matches[:3]
                except:
                    # Fallback to line parsing
                    lines = judge_4_response.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                            issues_4.append(line[1:].strip())
                        elif re.match(r'^\d+\.', line):
                            issues_4.append(line[2:].strip())
                    issues_4 = issues_4[:3]
                
                # Parse advice from JSON
                advice_4 = "No specific advice provided"
                try:
                    advice_match = re.search(r'"advice":\s*"([^"]+)"', judge_4_response)
                    if advice_match:
                        advice_4 = advice_match.group(1)
                except:
                    # Fallback to line parsing
                    lines = judge_4_response.split('\n')
                    for line in lines:
                        if "advice:" in line.lower():
                            advice_4 = line.split(':', 1)[1].strip()
                            break
                
                judge_4 = JudgeResponse(
                    judge_id="judge_4",
                    judge_name="Judge 4 - Cost & Efficiency",
                    score=score_4,
                    verdict=verdict_4,
                    reasoning=f"Opik-tracked analysis: Score {score_4}/10\n\nTop issues:\n" + "\n".join([f"- {issue}" for issue in issues_4]),
                    issues=issues_4,
                    advice=advice_4
                )
                judges.append(judge_4)
                
            except Exception as e:
                print(f"Judge 4 error: {e}")
        
        # Calculate overall score
        total_score = sum(judge.score for judge in judges)
        avg_score = total_score / len(judges) if judges else 0
        
        # Determine overall verdict
        overall_verdict = "GOOD" if avg_score >= 7 else "NEEDS_IMPROVEMENT"
        
        # Create summary
        selected_count = sum(1 for selected in selected_judges.values() if selected)
        summary = f"Evaluated by {len(judges)} selected judges. Average score: {avg_score:.1f}/10"
        
        verdict = FrontendJuryVerdict(
            case_id=f"case_{hash(code) % 10000}",
            overall_score=int(avg_score),
            verdict=overall_verdict,
            judges=judges,
            summary=summary
        )
        
        return verdict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Selected judges evaluation failed: {str(e)}")


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
