"""add generation metadata to synthetic responses

Revision ID: 7c91f2a6d4b8
Revises: 042632df1035
Create Date: 2026-09-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c91f2a6d4b8"
down_revision: Union[str, None] = "042632df1035"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "synthetic_responses",
        sa.Column(
            "generation_id",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "synthetic_responses",
        sa.Column(
            "model_name",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "synthetic_responses",
        sa.Column(
            "generation_status",
            sa.String(length=30),
            nullable=True,
        ),
    )

    op.create_index(
        op.f("ix_synthetic_responses_generation_id"),
        "synthetic_responses",
        ["generation_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_synthetic_responses_generation_id"),
        table_name="synthetic_responses",
    )

    op.drop_column(
        "synthetic_responses",
        "generation_status",
    )

    op.drop_column(
        "synthetic_responses",
        "model_name",
    )

    op.drop_column(
        "synthetic_responses",
        "generation_id",
    )