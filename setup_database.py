"""
Database setup script for FAQ Analytics Dashboard
Run this script to create the database and tables
"""

import sys
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_models import create_database_with_indexes

# Load environment variables
load_dotenv()


def create_database_if_not_exists():
    """Create the database if it doesn't exist"""

    # Database configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "faq_analytics")

    try:
        # Connect to PostgreSQL server (not to a specific database)
        connection = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database="postgres",  # Connect to default postgres database
        )

        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = connection.cursor()

        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        exists = cursor.fetchone()

        if not exists:
            # Create database
            cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
            print(f"✅ Database '{DB_NAME}' created successfully!")
        else:
            print(f"ℹ️  Database '{DB_NAME}' already exists.")

        cursor.close()
        connection.close()

        return True

    except psycopg2.Error as e:
        print(f"❌ Error creating database: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def setup_database():
    """Complete database setup process"""
    print("🚀 Starting FAQ Analytics Database Setup...")
    print("=" * 50)

    # Step 1: Create database if not exists
    print("📊 Step 1: Creating database...")
    if not create_database_if_not_exists():
        print("❌ Failed to create database. Please check your PostgreSQL connection.")
        return False

    # Step 2: Create tables and indexes
    print("\n📋 Step 2: Creating tables and indexes...")
    try:
        create_database_with_indexes()
        print("✅ Tables and indexes created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

    # Step 3: Verify setup
    print("\n🔍 Step 3: Verifying database setup...")
    try:
        from database_models import DatabaseManager

        db_manager = DatabaseManager()

        with db_manager.get_session() as session:
            # Test basic connectivity
            from sqlalchemy import text

            result = session.execute(text("SELECT 1"))
            if result.fetchone():
                print("✅ Database connection test successful!")

            # Check tables exist
            tables_query = text(
                """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
            """
            )
            result = session.execute(tables_query)
            tables = [row[0] for row in result.fetchall()]

            expected_tables = [
                "users",
                "faq_interactions",
                "unanswered_questions",
                "system_metrics",
                "faq_file_stats",
            ]

            print(f"📋 Created tables: {', '.join(tables)}")

            missing_tables = set(expected_tables) - set(tables)
            if missing_tables:
                print(f"⚠️  Missing tables: {', '.join(missing_tables)}")
                return False
            else:
                print("✅ All required tables are present!")

        return True

    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        return False


def create_admin_user():
    """Create an initial admin user for the analytics dashboard"""
    print("\n👤 Creating admin user...")
    try:
        from database_models import DatabaseManager, User
        import bcrypt

        db_manager = DatabaseManager()

        with db_manager.get_session() as session:
            # Check if admin user already exists
            existing_admin = (
                session.query(User).filter(User.username == "admin").first()
            )

            if existing_admin:
                print("ℹ️  Admin user already exists.")
                return True

            # Create admin user
            password = "admin123"  # Default password - should be changed in production
            password_hash = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8")

            admin_user = User(
                username="admin",
                email="admin@vitalynk.com",
                password_hash=password_hash,
                role="admin",
            )

            session.add(admin_user)
            session.commit()

            print("✅ Admin user created successfully!")
            print("   Username: admin")
            print("   Password: admin123")
            print("   ⚠️  Please change the password after first login!")

            return True

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False


if __name__ == "__main__":
    print("🏥 Vitalynk FAQ Analytics Database Setup")
    print("=" * 50)

    # Display current configuration
    print("📋 Configuration:")
    print(f"   Host: {os.getenv('DB_HOST', 'localhost')}")
    print(f"   Port: {os.getenv('DB_PORT', '5432')}")
    print(f"   Database: {os.getenv('DB_NAME', 'faq_analytics')}")
    print(f"   User: {os.getenv('DB_USER', 'postgres')}")
    print("=" * 50)

    # Run setup
    success = setup_database()

    if success:
        # Create admin user
        create_admin_user()

        print("\n🎉 Database setup completed successfully!")
        print("\n📝 Next steps:")
        print("1. Start the FAQ MCP server: python start_server.py")
        print("2. Test the server: python test_faq_server.py")
        print("3. Begin using the analytics features!")
        print("\n💡 Tip: Use the 'get_analytics_summary' tool to check analytics data.")
    else:
        print("\n❌ Database setup failed. Please check the errors above.")
        sys.exit(1)
