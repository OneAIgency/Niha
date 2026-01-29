# Archived migrations

These migrations are from the previous migration chain and are **no longer run** by Alembic.

The application now uses a single baseline revision (`2026_01_29_baseline`). Schema is created and updated by app startup (`init_db()` / `Base.metadata.create_all`).

These files are kept only for historical reference.
