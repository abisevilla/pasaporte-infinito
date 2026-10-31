"""Identidades anónimas, partidas y recibos idempotentes."""

import sqlalchemy as sa
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "guests",
        sa.Column("sessionHash", sa.String(64), primary_key=True),
        sa.Column("activeGameId", sa.String(36), nullable=True),
    )
    op.create_table(
        "games",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ownerHash", sa.String(64), sa.ForeignKey("guests.sessionHash"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("state", sa.JSON(), nullable=False),
    )
    op.create_index("ix_games_ownerHash", "games", ["ownerHash"])
    op.create_table(
        "receipts",
        sa.Column("gameId", sa.String(36), sa.ForeignKey("games.id"), primary_key=True),
        sa.Column("requestId", sa.String(36), primary_key=True),
        sa.Column("requestHash", sa.String(64), nullable=False),
        sa.Column("response", sa.JSON(), nullable=False),
    )


def downgrade():
    op.drop_table("receipts")
    op.drop_index("ix_games_ownerHash", table_name="games")
    op.drop_table("games")
    op.drop_table("guests")
