"""add partial unique index for approved claims

Revision ID: 495994c08dd5
Revises: 343129ab4013
Create Date: 2026-10-18 02:11:54.773835

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '495994c08dd5'
down_revision: Union[str, Sequence[str], None] = '343129ab4013'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE UNIQUE INDEX uq_claims_approved_item ON claims (item_id) WHERE (status = 'approved')")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX uq_claims_approved_item")
