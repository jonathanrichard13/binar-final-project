import json
import logging
import re
from typing import Dict, Optional, Tuple
from datetime import datetime


class ClaudeReasoningEngine:
    """Handles Claude chain-of-thoughts analysis for FAQ matching"""

    def __init__(self):
        self.analysis_prompt_template = """
You are an intelligent FAQ assistant. Analyze the user's query against the available FAQ content and determine the best response.

User Query: "{query}"

Available FAQ Content:
{faq_content}

Please analyze this step by step:

Step 1: Identify which FAQ file/section is most relevant to the user's query
Step 2: Evaluate if this best match actually contains information that addresses the user's question
Step 3: Make a decision - if the content adequately addresses the query, provide the specific answer. If not relevant enough, respond with "NO_ANSWER"

Your response should be in this exact JSON format:
{{
    "analysis": "Brief explanation of your reasoning process",
    "best_match_file": "filename.txt or null if no good match",
    "relevance_score": "high/medium/low",
    "decision": "ANSWER or NO_ANSWER",
    "answer": "The specific answer from the FAQ if decision is ANSWER, otherwise null"
}}

Remember: Only provide an answer if you're confident the FAQ content directly addresses the user's question. When in doubt, choose NO_ANSWER.
"""

    async def analyze_query_against_faqs(self, query: str, faq_content: str) -> Dict:
        """Send structured prompt to Claude and parse response"""

        # For this implementation, we'll simulate Claude's reasoning
        # In a real implementation, this would make an API call to Claude
        response = self._simulate_claude_analysis(query, faq_content)

        return response

    def _simulate_claude_analysis(self, query: str, faq_content: str) -> Dict:
        """Simulate Claude's chain-of-thoughts analysis"""

        # Simple keyword-based matching for demonstration
        # This simulates what Claude would do with more sophisticated reasoning

        query_lower = query.lower()
        best_match_file = None
        best_match_score = 0
        best_answer = None
        reasoning = ""

        # Parse FAQ content to find matches
        file_sections = faq_content.split("=== ")

        for section in file_sections[1:]:  # Skip first empty split
            if not section.strip():
                continue

            lines = section.split("\n")
            if not lines:
                continue

            # Extract filename from header
            header = lines[0]
            filename_match = re.search(r"\(([^)]+\.txt)\)", header)
            if not filename_match:
                continue

            filename = filename_match.group(1)
            section_content = "\n".join(lines[1:]).lower()

            # Calculate relevance score based on keyword overlap
            score = self._calculate_relevance_score(query_lower, section_content)

            if score > best_match_score:
                best_match_score = score
                best_match_file = filename
                best_answer = self._extract_best_answer(lines[1:], query_lower)
                reasoning = (
                    f"Found relevant content in {filename} with score {score:.2f}"
                )

        # Determine if match is good enough (increased threshold for better accuracy)
        if best_match_score > 0.5:  # Increased threshold for relevance
            decision = "ANSWER"
            relevance = (
                "high"
                if best_match_score > 0.8
                else "medium" if best_match_score > 0.6 else "low"
            )
        else:
            decision = "NO_ANSWER"
            relevance = "low"
            best_answer = None
            reasoning = f"No sufficiently relevant content found. Best score was {best_match_score:.2f}, required minimum is 0.5"

        return {
            "analysis": reasoning,
            "best_match_file": best_match_file,
            "relevance_score": relevance,
            "decision": decision,
            "answer": best_answer,
        }

    def _calculate_relevance_score(self, query: str, content: str) -> float:
        """Calculate relevance score between query and content"""

        # Simple keyword-based scoring
        query_words = set(re.findall(r"\b\w+\b", query.lower()))
        content_words = set(re.findall(r"\b\w+\b", content.lower()))

        if not query_words:
            return 0.0

        # Calculate overlap
        overlap = len(query_words.intersection(content_words))
        score = overlap / len(query_words)

        # Boost score for exact phrase matches
        if query.lower() in content.lower():
            score += 0.3

        return min(score, 1.0)

    def _extract_best_answer(self, content_lines: list, query: str) -> Optional[str]:
        """Extract the best matching answer from content lines"""

        qa_pairs = []
        current_answer = ""
        current_question = ""

        for line in content_lines:
            line = line.strip()
            if line.startswith("Q") and ":" in line:
                # Save previous Q&A pair
                if current_answer and current_question:
                    qa_pairs.append((current_question, current_answer))
                # Start new question
                current_question = line.split(":", 1)[1].strip()
                current_answer = ""
            elif line.startswith("A") and ":" in line:
                current_answer = line.split(":", 1)[1].strip()
            elif current_answer and line and not line.startswith("Q"):
                current_answer += " " + line

        # Save last Q&A pair
        if current_answer and current_question:
            qa_pairs.append((current_question, current_answer))

        if not qa_pairs:
            return None

        # Find the most relevant answer by comparing questions with the query
        best_answer = None
        best_score = 0

        for question, answer in qa_pairs:
            score = self._calculate_relevance_score(query.lower(), question.lower())
            if score > best_score:
                best_score = score
                best_answer = answer

        # If no good question match, return the first answer
        return best_answer if best_answer else qa_pairs[0][1]

    def format_reasoning_for_user(self, analysis_result: Dict) -> str:
        """Format the reasoning in a user-friendly way"""

        analysis = analysis_result.get("analysis", "")
        relevance = analysis_result.get("relevance_score", "unknown")
        file_match = analysis_result.get("best_match_file", "none")

        if analysis_result.get("decision") == "ANSWER":
            return f"Found relevant information in {file_match} (relevance: {relevance}). {analysis}"
        else:
            return f"Could not find sufficiently relevant content. {analysis}"
