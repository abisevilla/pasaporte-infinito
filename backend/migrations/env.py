"""Migraciones reproducibles sin cargar archivos de entorno."""

import os
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine

from app.infrastructure.database import Base

config = context.config
databaseUrl = os.environ.get("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
target_metadata = Base.metadata

if context.is_offline_mode():
    context.configure(url=databaseUrl, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    if databaseUrl.startswith("sqlite:///"):
        Path(databaseUrl.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    with create_engine(databaseUrl).connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
