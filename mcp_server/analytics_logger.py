"""
Analytics Logger for FAQ MCP Server
Handles logging of user queries, responses, and unanswered questions to the database
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text
import re

from database_models import (
    DatabaseManager,
    FaqInteraction,
    UnansweredQuestion,
    FaqFileStat,
    SystemMetric,
)


class AnalyticsLogger:
    """Handles all analytics logging for FAQ MCP server"""

    def __init__(self):
        self.db_manager = DatabaseManager()
        self.logger = logging.getLogger(__name__)

        # Ensure database tables exist
        try:
            self.db_manager.create_tables()
        except Exception as e:
            self.logger.error(f"Failed to create database tables: {e}")

    async def log_faq_interaction(self, interaction_data: Dict) -> bool:
        """
        Log a FAQ interaction to the database

        Args:
            interaction_data: Dictionary containing:
                - query_text: str
                - status: str ('success', 'no_answer', 'error')
                - source_file: Optional[str]
                - reasoning: Optional[str]
                - processing_time: Optional[float]
                - session_id: Optional[str]
                - user_agent: Optional[str]
                - ip_address: Optional[str]

        Returns:
            bool: True if logged successfully, False otherwise
        """
        try:
            with self.db_manager.get_session() as session:
                interaction = FaqInteraction(
                    query_text=interaction_data.get("query_text", ""),
                    status=interaction_data.get("status", "unknown"),
                    source_file=interaction_data.get("source_file"),
                    reasoning=interaction_data.get("reasoning"),
                    processing_time=interaction_data.get("processing_time"),
                    session_id=interaction_data.get("session_id"),
                    user_agent=interaction_data.get("user_agent"),
                    ip_address=interaction_data.get("ip_address"),
                    timestamp=datetime.now(),
                )

                session.add(interaction)
                session.commit()

                # Update FAQ file statistics if applicable
                if interaction_data.get("source_file"):
                    await self._update_faq_file_stats(
                        interaction_data["source_file"],
                        interaction_data.get("status") == "success",
                    )

                self.logger.info(
                    f"Logged FAQ interaction: {interaction_data.get('status')}"
                )
                return True

        except Exception as e:
            self.logger.error(f"Failed to log FAQ interaction: {e}")
            return False

    async def log_unanswered_question(self, question_data: Dict) -> bool:
        """
        Log an unanswered question to the database

        Args:
            question_data: Dictionary containing:
                - question: str
                - session_id: Optional[str]
                - reasoning_trace: Optional[Dict]
                - user_context: Optional[Dict]

        Returns:
            bool: True if logged successfully, False otherwise
        """
        try:
            question_text = question_data.get("question", "")

            # Check if similar question already exists
            similar_question = await self._find_similar_question(question_text)

            with self.db_manager.get_session() as session:
                if similar_question:
                    # Update existing question frequency
                    similar_question.frequency += 1
                    similar_question.last_asked = datetime.now()
                    session.merge(similar_question)
                    self.logger.info(
                        f"Updated frequency for similar question: {similar_question.id}"
                    )
                else:
                    # Create new unanswered question
                    priority = await self._calculate_priority(question_text)
                    category = await self._categorize_question(question_text)

                    unanswered_question = UnansweredQuestion(
                        question=question_text,
                        frequency=1,
                        priority=priority,
                        category=category,
                        status="pending",
                        business_impact="medium",
                    )

                    session.add(unanswered_question)
                    self.logger.info("Created new unanswered question entry")

                session.commit()
                return True

        except Exception as e:
            self.logger.error(f"Failed to log unanswered question: {e}")
            return False

    async def log_system_metric(
        self, metric_name: str, metric_value: float, metric_unit: str = None
    ) -> bool:
        """
        Log a system performance metric

        Args:
            metric_name: Name of the metric (e.g., 'response_time', 'memory_usage')
            metric_value: Value of the metric
            metric_unit: Optional unit (e.g., 'ms', 'MB', '%')

        Returns:
            bool: True if logged successfully, False otherwise
        """
        try:
            with self.db_manager.get_session() as session:
                metric = SystemMetric(
                    metric_name=metric_name,
                    metric_value=metric_value,
                    metric_unit=metric_unit,
                    timestamp=datetime.now(),
                )

                session.add(metric)
                session.commit()
                return True

        except Exception as e:
            self.logger.error(f"Failed to log system metric: {e}")
            return False

    async def _update_faq_file_stats(self, file_name: str, is_success: bool):
        """Update statistics for a FAQ file"""
        try:
            with self.db_manager.get_session() as session:
                # Get or create FAQ file stats for today
                today = datetime.now().date()

                stats = (
                    session.query(FaqFileStat)
                    .filter(
                        FaqFileStat.file_name == file_name,
                        FaqFileStat.timestamp >= today,
                    )
                    .first()
                )

                if not stats:
                    stats = FaqFileStat(
                        file_name=file_name, total_queries=0, successful_queries=0
                    )
                    session.add(stats)

                stats.total_queries += 1
                if is_success:
                    stats.successful_queries += 1
                stats.last_updated = datetime.now()

                session.commit()

        except Exception as e:
            self.logger.error(f"Failed to update FAQ file stats: {e}")

    async def _find_similar_question(
        self, question_text: str
    ) -> Optional[UnansweredQuestion]:
        """
        Find similar unanswered questions using simple text similarity
        In the future, this could use more sophisticated NLP techniques
        """
        try:
            with self.db_manager.get_session() as session:
                # Get all pending/in_progress questions
                existing_questions = (
                    session.query(UnansweredQuestion)
                    .filter(UnansweredQuestion.status.in_(["pending", "in_progress"]))
                    .all()
                )

                # Simple similarity check (can be improved with embeddings)
                question_words = set(self._normalize_text(question_text).split())

                for existing in existing_questions:
                    existing_words = set(
                        self._normalize_text(existing.question).split()
                    )

                    # Calculate Jaccard similarity
                    intersection = len(question_words.intersection(existing_words))
                    union = len(question_words.union(existing_words))

                    if union > 0:
                        similarity = intersection / union
                        if similarity > 0.7:  # 70% similarity threshold
                            return existing

                return None

        except Exception as e:
            self.logger.error(f"Failed to find similar questions: {e}")
            return None

    async def _calculate_priority(self, question_text: str) -> str:
        """
        Calculate priority based on question content
        Uses keyword matching for basic priority assignment
        """
        question_lower = question_text.lower()

        # Urgent indicators
        urgent_keywords = [
            "urgent",
            "emergency",
            "critical",
            "broken",
            "down",
            "error",
            "failed",
            "crash",
        ]
        if any(keyword in question_lower for keyword in urgent_keywords):
            return "urgent"

        # High priority indicators (business/account related)
        high_keywords = [
            "billing",
            "payment",
            "subscription",
            "account",
            "login",
            "access",
            "security",
        ]
        if any(keyword in question_lower for keyword in high_keywords):
            return "high"

        # Medium priority indicators (device/technical)
        medium_keywords = ["device", "sync", "connection", "setup", "install", "update"]
        if any(keyword in question_lower for keyword in medium_keywords):
            return "medium"

        # Default to low priority
        return "low"

    async def _categorize_question(self, question_text: str) -> str:
        """
        Categorize question based on content
        Maps to common FAQ categories
        """
        question_lower = question_text.lower()

        # Category mapping based on keywords
        categories = {
            "account_management": [
                "account",
                "profile",
                "login",
                "password",
                "signup",
                "register",
            ],
            "billing_payments": [
                "billing",
                "payment",
                "subscription",
                "plan",
                "charge",
                "invoice",
            ],
            "technical_issues": [
                "error",
                "bug",
                "broken",
                "fix",
                "issue",
                "problem",
                "crash",
            ],
            "device_setup": ["device", "setup", "install", "connect", "sync", "pair"],
            "mobile_app": ["app", "mobile", "android", "ios", "phone"],
            "privacy_security": ["privacy", "security", "data", "encryption", "safe"],
            "general": [],  # fallback category
        }

        for category, keywords in categories.items():
            if any(keyword in question_lower for keyword in keywords):
                return category

        return "general"

    def _normalize_text(self, text: str) -> str:
        """Normalize text for similarity comparison"""
        # Convert to lowercase and remove special characters
        normalized = re.sub(r"[^a-zA-Z0-9\s]", "", text.lower())
        # Remove extra whitespace
        normalized = " ".join(normalized.split())
        return normalized

    async def get_analytics_summary(self) -> Dict:
        """Get a summary of current analytics data"""
        try:
            with self.db_manager.get_session() as session:
                # Get total interactions
                total_interactions = session.query(FaqInteraction).count()

                # Get successful interactions
                successful_interactions = (
                    session.query(FaqInteraction)
                    .filter(FaqInteraction.status == "success")
                    .count()
                )

                # Get pending unanswered questions
                pending_questions = (
                    session.query(UnansweredQuestion)
                    .filter(UnansweredQuestion.status == "pending")
                    .count()
                )

                # Calculate success rate
                success_rate = (
                    (successful_interactions / total_interactions * 100)
                    if total_interactions > 0
                    else 0
                )

                return {
                    "total_interactions": total_interactions,
                    "successful_interactions": successful_interactions,
                    "success_rate": round(success_rate, 2),
                    "pending_unanswered_questions": pending_questions,
                    "timestamp": datetime.now().isoformat(),
                }

        except Exception as e:
            self.logger.error(f"Failed to get analytics summary: {e}")
            return {}


# Global analytics logger instance
analytics_logger = AnalyticsLogger()
