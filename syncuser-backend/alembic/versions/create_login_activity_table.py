from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7f4a9c2e1b6d"

down_revision: Union[str, None] = "34ff5bd858f2"

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "login_activities",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "login_at",
            sa.DateTime(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_login_activities_id",
        "login_activities",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_login_activities_user_id",
        "login_activities",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_login_activities_user_id",
        table_name="login_activities",
    )

    op.drop_index(
        "ix_login_activities_id",
        table_name="login_activities",
    )

    op.drop_table("login_activities")