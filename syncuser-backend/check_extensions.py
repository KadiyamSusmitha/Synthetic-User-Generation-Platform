from sqlalchemy import text

from app.database import engine


with engine.connect() as db:
    extensions = db.execute(
        text("SELECT extname FROM pg_extension")
    ).fetchall()

    print("Installed PostgreSQL extensions:")

    for extension in extensions:
        print(extension[0])