"""
Opik Evaluation Functions for LLM Jury System

This module defines custom evaluation functions that work with Opik's
evaluation framework to assess code submissions.
"""

from typing import Dict, Any, List
import json
from app.services.o4_mini_service import OpenAIo4Service


class CodeQualityEvaluator:
    """Custom evaluator for code quality assessment using Opik-tracked LLM calls"""
    
    def __init__(self):
        # Use the existing Opik-tracked service
        self.o4_service = OpenAIo4Service()
    
    def evaluate_prompting_quality(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate prompting quality in the submitted code.
        
        Args:
            item: Dictionary containing 'code' and 'language' keys
            
        Returns:
            Dictionary with evaluation results
        """
        code = item.get('code', '')
        language = item.get('language', 'python')
        
        # Create a prompt analysis task
        analysis_prompt = f"""
        Analyze this {language} code for prompt engineering quality:
        
        ```{language}
        {code}
        ```
        
        Evaluate:
        1. Prompt clarity and specificity
        2. System message effectiveness
        3. Error handling in prompts
        4. Best practices adherence
        
        Return a JSON response with:
        - score: 1-10
        - verdict: "GOOD" or "NEEDS_IMPROVEMENT"
        - issues: [list of specific issues]
        - advice: "specific improvement advice"
        """
        
        # This will be tracked by Opik automatically
        response = self.o4_service.call_o4_api(
            system_prompt=analysis_prompt,
            data=f"Evaluate this {language} code for prompting quality"
        )
        
        try:
            result = json.loads(response)
            return {
                "score": result.get("score", 5),
                "verdict": result.get("verdict", "NEEDS_IMPROVEMENT"),
                "issues": result.get("issues", []),
                "advice": result.get("advice", "No specific advice"),
                "evaluation_type": "prompting_quality"
            }
        except json.JSONDecodeError:
            return {
                "score": 5,
                "verdict": "NEEDS_IMPROVEMENT",
                "issues": ["Failed to parse evaluation response"],
                "advice": "Evaluation system error",
                "evaluation_type": "prompting_quality"
            }
    
    def evaluate_database_optimization(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate database optimization in the code"""
        code = item.get('code', '')
        language = item.get('language', 'python')
        
        analysis_prompt = f"""
        Analyze this {language} code for database optimization:
        
        ```{language}
        {code}
        ```
        
        Evaluate:
        1. Query efficiency
        2. Connection management
        3. Data modeling
        4. Security practices
        5. Performance optimization
        
        Return a JSON response with:
        - score: 1-10
        - verdict: "OPTIMIZED" or "NEEDS_OPTIMIZATION"
        - issues: [list of specific issues]
        - advice: "specific optimization advice"
        """
        
        response = self.o4_service.call_o4_api(
            system_prompt=analysis_prompt,
            data=f"Evaluate this {language} code for database optimization"
        )
        
        try:
            result = json.loads(response)
            return {
                "score": result.get("score", 5),
                "verdict": result.get("verdict", "NEEDS_OPTIMIZATION"),
                "issues": result.get("issues", []),
                "advice": result.get("advice", "No specific advice"),
                "evaluation_type": "database_optimization"
            }
        except json.JSONDecodeError:
            return {
                "score": 5,
                "verdict": "NEEDS_OPTIMIZATION",
                "issues": ["Failed to parse evaluation response"],
                "advice": "Evaluation system error",
                "evaluation_type": "database_optimization"
            }
    
    def evaluate_security_safety(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate security and safety in the code"""
        code = item.get('code', '')
        language = item.get('language', 'python')
        
        analysis_prompt = f"""
        Analyze this {language} code for security and safety:
        
        ```{language}
        {code}
        ```
        
        Evaluate:
        1. Input validation
        2. API key management
        3. Authentication/authorization
        4. Data privacy
        5. Common vulnerabilities
        
        Return a JSON response with:
        - score: 1-10
        - verdict: "SECURE" or "VULNERABLE"
        - issues: [list of specific issues]
        - advice: "specific security advice"
        """
        
        response = self.o4_service.call_o4_api(
            system_prompt=analysis_prompt,
            data=f"Evaluate this {language} code for security and safety"
        )
        
        try:
            result = json.loads(response)
            return {
                "score": result.get("score", 5),
                "verdict": result.get("verdict", "VULNERABLE"),
                "issues": result.get("issues", []),
                "advice": result.get("advice", "No specific advice"),
                "evaluation_type": "security_safety"
            }
        except json.JSONDecodeError:
            return {
                "score": 5,
                "verdict": "VULNERABLE",
                "issues": ["Failed to parse evaluation response"],
                "advice": "Evaluation system error",
                "evaluation_type": "security_safety"
            }
    
    def evaluate_cost_efficiency(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate cost and efficiency in the code"""
        code = item.get('code', '')
        language = item.get('language', 'python')
        
        analysis_prompt = f"""
        Analyze this {language} code for cost and efficiency:
        
        ```{language}
        {code}
        ```
        
        Evaluate:
        1. Token usage optimization
        2. Model selection appropriateness
        3. Caching strategies
        4. Response streaming
        5. Cost optimization opportunities
        
        Return a JSON response with:
        - score: 1-10
        - verdict: "EFFICIENT" or "INEFFICIENT"
        - issues: [list of specific issues]
        - advice: "specific efficiency advice"
        """
        
        response = self.o4_service.call_o4_api(
            system_prompt=analysis_prompt,
            data=f"Evaluate this {language} code for cost and efficiency"
        )
        
        try:
            result = json.loads(response)
            return {
                "score": result.get("score", 5),
                "verdict": result.get("verdict", "INEFFICIENT"),
                "issues": result.get("issues", []),
                "advice": result.get("advice", "No specific advice"),
                "evaluation_type": "cost_efficiency"
            }
        except json.JSONDecodeError:
            return {
                "score": 5,
                "verdict": "INEFFICIENT",
                "issues": ["Failed to parse evaluation response"],
                "advice": "Evaluation system error",
                "evaluation_type": "cost_efficiency"
            }


def run_jury_evaluation(submissions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Run the complete jury evaluation using Opik-tracked LLM calls.
    
    Args:
        submissions: List of code submissions
        
    Returns:
        List of evaluation results for each submission
    """
    evaluator = CodeQualityEvaluator()
    results = []
    
    for submission in submissions:
        # Run all four evaluations
        evaluations = {
            "prompting": evaluator.evaluate_prompting_quality(submission),
            "database": evaluator.evaluate_database_optimization(submission),
            "security": evaluator.evaluate_security_safety(submission),
            "efficiency": evaluator.evaluate_cost_efficiency(submission)
        }
        
        # Calculate overall score
        scores = [eval_data["score"] for eval_data in evaluations.values()]
        overall_score = sum(scores) / len(scores) if scores else 0
        
        # Determine overall verdict
        overall_verdict = "NOT GUILTY" if overall_score >= 7 else "GUILTY"
        
        # Collect all issues
        all_issues = []
        for eval_data in evaluations.values():
            all_issues.extend(eval_data.get("issues", []))
        
        result = {
            "submission": submission,
            "overall_score": int(overall_score),
            "overall_verdict": overall_verdict,
            "total_issues": len(all_issues),
            "evaluations": evaluations
        }
        
        results.append(result)
    
    return results
