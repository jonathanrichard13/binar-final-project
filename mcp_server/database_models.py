"""
Database models and schema for FAQ Analytics Dashboard
Based on the PRD specifications with PostgreSQL
"""

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    ARRAY,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "faq_analytics")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

Base = declarative_base()


class User(Base):
    """Users table for authentication and access control"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="viewer")  # 'admin', 'editor', 'viewer'
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    assigned_questions = relationship("UnansweredQuestion", back_populates="assignee")


class FaqInteraction(Base):
    """Enhanced FAQ interactions table for comprehensive analytics"""

    __tablename__ = "faq_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=func.now())
    query_text = Column(Text, nullable=False)
    status = Column(String(20), nullable=False)  # 'success', 'no_answer', 'error'
    source_file = Column(String(100))
    reasoning = Column(Text)
    processing_time = Column(Float)
    session_id = Column(String(50))
    user_feedback = Column(Integer)  # 1-5 rating or null
    user_agent = Column(Text)
    ip_address = Column(String(45))  # IPv6 compatible


class UnansweredQuestion(Base):
    """Unanswered questions management table"""

    __tablename__ = "unanswered_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    frequency = Column(Integer, default=1)
    first_asked = Column(DateTime, default=func.now())
    last_asked = Column(DateTime, default=func.now())
    status = Column(
        String(20), default="pending"
    )  # 'pending', 'in_progress', 'answered', 'rejected'
    priority = Column(String(10), default="medium")  # 'low', 'medium', 'high', 'urgent'
    assigned_to = Column(Integer, ForeignKey("users.id"))
    category = Column(String(100))
    tags = Column(ARRAY(String))  # PostgreSQL array type
    suggested_faq_file = Column(String(100))
    draft_answer = Column(Text)
    resolution_notes = Column(Text)
    business_impact = Column(String(10), default="medium")  # 'low', 'medium', 'high'
    estimated_resolution_time = Column(Integer)  # in hours
    actual_resolution_time = Column(Integer)  # in hours
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    assignee = relationship("User", back_populates="assigned_questions")


class SystemMetric(Base):
    """System performance metrics table"""

    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=func.now())
    metric_name = Column(String(50), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(20))
    additional_info = Column(Text)  # JSON string for additional data


class FaqFileStat(Base):
    """FAQ file statistics table"""

    __tablename__ = "faq_file_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=func.now())
    file_name = Column(String(100), nullable=False)
    total_queries = Column(Integer, default=0)
    successful_queries = Column(Integer, default=0)
    last_updated = Column(DateTime, default=func.now())

    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_queries > 0:
            return (self.successful_queries / self.total_queries) * 100
        return 0.0


class DatabaseManager:
    """Database manager for FAQ Analytics system"""

    def __init__(self, database_url: str = None):
        if database_url is None:
            database_url = DATABASE_URL

        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def create_tables(self):
        """Create all tables in the database"""
        Base.metadata.create_all(bind=self.engine)
        print("All tables created successfully!")

    def get_session(self):
        """Get a database session"""
        return self.SessionLocal()

    def drop_tables(self):
        """Drop all tables (use with caution!)"""
        Base.metadata.drop_all(bind=self.engine)
        print("All tables dropped!")


# Create indexes for performance (to be run after table creation)
CREATE_INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_faq_interactions_timestamp ON faq_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_faq_interactions_status ON faq_interactions(status);
CREATE INDEX IF NOT EXISTS idx_faq_interactions_session_id ON faq_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_status ON unanswered_questions(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_priority ON unanswered_questions(priority);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_assigned ON unanswered_questions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_category ON unanswered_questions(category);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_faq_file_stats_file_name ON faq_file_stats(file_name);
CREATE INDEX IF NOT EXISTS idx_faq_file_stats_timestamp ON faq_file_stats(timestamp);
"""


def create_database_with_indexes():
    """Create database tables and indexes"""
    db_manager = DatabaseManager()

    # Create tables
    db_manager.create_tables()

    # Create indexes using raw SQL
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_faq_interactions_timestamp ON faq_interactions(timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_faq_interactions_status ON faq_interactions(status);",
        "CREATE INDEX IF NOT EXISTS idx_faq_interactions_session_id ON faq_interactions(session_id);",
        "CREATE INDEX IF NOT EXISTS idx_unanswered_questions_status ON unanswered_questions(status);",
        "CREATE INDEX IF NOT EXISTS idx_unanswered_questions_priority ON unanswered_questions(priority);",
        "CREATE INDEX IF NOT EXISTS idx_unanswered_questions_assigned ON unanswered_questions(assigned_to);",
        "CREATE INDEX IF NOT EXISTS idx_unanswered_questions_category ON unanswered_questions(category);",
        "CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);",
        "CREATE INDEX IF NOT EXISTS idx_faq_file_stats_file_name ON faq_file_stats(file_name);",
        "CREATE INDEX IF NOT EXISTS idx_faq_file_stats_timestamp ON faq_file_stats(timestamp);",
    ]

    with db_manager.engine.connect() as connection:
        for index_sql in indexes:
            try:
                connection.execute(text(index_sql))
                connection.commit()
            except Exception as e:
                print(f"Warning: Could not create index: {e}")

    print("Database schema created successfully with indexes!")


if __name__ == "__main__":
    # Create database schema when run directly
    create_database_with_indexes()
