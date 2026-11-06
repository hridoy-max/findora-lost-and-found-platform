import os
import subprocess
import sys
from dotenv import load_dotenv

load_dotenv()

def bootstrap():
    """
    Bootstraps the test database for the Findora project.
    1. Verifies TEST_DATABASE_URL is set.
    2. Runs Alembic migrations to bring the test DB to the current head.
    3. Runs the seed script against the test DB to provide baseline data.
    """
    test_db_url = os.getenv("TEST_DATABASE_URL")

    if not test_db_url:
        print("Error: TEST_DATABASE_URL not found in environment variables.")
        sys.exit(1)

    print(f"Bootstrapping test database: {test_db_url}")

    try:
        env = os.environ.copy()
        env["DATABASE_URL"] = test_db_url

        print("Running migrations on test database...")
        subprocess.run(
            ["alembic", "upgrade", "head"],
            env=env,
            check=True,
            capture_output=True,
            text=True
        )
        print("Migrations applied successfully.")

        print("Seeding test database...")
        subprocess.run(
            [sys.executable, "-m", "scripts.seed"],
            env=env,
            check=True,
            capture_output=True,
            text=True
        )
        print("Seeding completed successfully.")

        print("\n✅ Test database is ready for pytest.")

    except subprocess.CalledProcessError as e:
        print(f"❌ Bootstrap failed during command: {e.cmd}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    bootstrap()
