from logging.config import fileConfig
import os

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from alembic import context

from app.database import Base
from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.models.login_activity import LoginActivity
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.response import Response
from app.models.report import Report
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.models.memory_embedding import MemoryEmbedding

load_dotenv()


config = context.config

database_url = os.getenv("DATABASE_URL")

if database_url:
    config.set_main_option(
    "sqlalchemy.url",
    database_url.replace("%", "%%"),
    )


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()