"""Comprueba las migraciones y la configuración real de persistencia."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.infrastructure.database import makeDatabase


def testInitialMigrationSupportsApplicationDatabase(tmp_path, monkeypatch):
    databaseUrl = f"sqlite:///{tmp_path / 'partidas.sqlite3'}"
    monkeypatch.setenv("DATABASE_URL", databaseUrl)
    backendPath = Path(__file__).resolve().parents[1]
    config = Config(str(backendPath / "alembic.ini"))
    command.upgrade(config, "head")

    engine, sessionFactory = makeDatabase(databaseUrl)
    try:
        assert {"guests", "games", "receipts"} <= set(inspect(engine).get_table_names())
        with sessionFactory() as session:
            assert session.connection().exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
            assert session.connection().exec_driver_sql("PRAGMA journal_mode").scalar() == "wal"
        command.upgrade(config, "head")
    finally:
        engine.dispose()
