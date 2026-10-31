"""Configuración de SQLite y modelos internos de persistencia."""

from pathlib import Path

from sqlalchemy import JSON, ForeignKey, Integer, String, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


class Base(DeclarativeBase):
    pass


class GuestRow(Base):
    __tablename__ = "guests"
    sessionHash: Mapped[str] = mapped_column(String(64), primary_key=True)
    activeGameId: Mapped[str | None] = mapped_column(String(36), nullable=True)


class GameRow(Base):
    __tablename__ = "games"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ownerHash: Mapped[str] = mapped_column(ForeignKey("guests.sessionHash"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    state: Mapped[dict] = mapped_column(JSON)


class ReceiptRow(Base):
    __tablename__ = "receipts"
    gameId: Mapped[str] = mapped_column(ForeignKey("games.id"), primary_key=True)
    requestId: Mapped[str] = mapped_column(String(36), primary_key=True)
    requestHash: Mapped[str] = mapped_column(String(64))
    response: Mapped[dict] = mapped_column(JSON)


def makeDatabase(databaseUrl: str):
    if databaseUrl.startswith("sqlite:///"):
        path = databaseUrl.removeprefix("sqlite:///")
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(databaseUrl, connect_args={"check_same_thread": False, "timeout": 15})

    @event.listens_for(engine, "connect")
    def configureSqlite(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

    return engine, sessionmaker(engine, expire_on_commit=False)
