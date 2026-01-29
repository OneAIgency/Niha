"""Baseline: current database schema

Schema is created and kept in sync by app startup (init_db / Base.metadata.create_all).
This revision exists so Alembic has a single head; no upgrade/downgrade steps.
Use: alembic stamp head (after first app start) to record current version.

New migrations: set down_revision = "2026_01_29_baseline" (or current head) in the
new revision file so they run after this baseline.

Revision ID: 2026_01_29_baseline
Revises: None
Create Date: 2026-01-29

"""


revision = "2026_01_29_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Schema is created by app init_db(); nothing to run here.
    pass


def downgrade():
    # No-op; schema is managed by the application.
    pass
