from sqlalchemy import create_engine, text
from config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'claims';"
    ))
    print("Indexes on claims table:")
    for row in result:
        print(row[0])
