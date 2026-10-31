"""Punto de entrada de FastAPI y entrega de la aplicación web."""

import hashlib
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.business.game.engine import GameError, citySummary
from app.data.content import loadCatalog
from app.data.repository import GameRepository
from app.infrastructure.database import makeDatabase
from app.presentation.contracts import ActionRequest, CatalogResponse, GameSnapshot, NewGameRequest

COOKIE_NAME = "pasaporte_session"


def createApp(databaseUrl: str | None = None) -> FastAPI:
    databaseUrl = databaseUrl or os.environ.get(
        "DATABASE_URL", "sqlite:///./data/pasaporte.sqlite3"
    )
    engine, sessionFactory = makeDatabase(databaseUrl)

    @asynccontextmanager
    async def lifespan(_app):
        loadCatalog()
        yield
        engine.dispose()

    app = FastAPI(title="Pasaporte Infinito", version="1.0.0", lifespan=lifespan)
    app.state.repository = GameRepository(sessionFactory)
    app.state.engine = engine

    @app.exception_handler(GameError)
    async def handleGameError(_request: Request, error: GameError):
        return JSONResponse(status_code=error.statusCode, content={"detail": str(error)})

    @app.middleware("http")
    async def protectRequest(request: Request, callNext):
        origin = request.headers.get("origin")
        if request.method not in {"GET", "HEAD", "OPTIONS"} and origin:
            configured = os.environ.get("PUBLIC_ORIGIN")
            allowed = {configured} if configured else {str(request.base_url).rstrip("/")}
            if origin not in allowed:
                return JSONResponse(
                    status_code=403, content={"detail": "Origen de solicitud no permitido."}
                )
        response = await callNext(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Frame-Options"] = "DENY"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    def owner(request: Request, response: Response) -> str:
        token = request.cookies.get(COOKIE_NAME)
        if not token or len(token) != 64 or any(c not in "0123456789abcdef" for c in token):
            token = secrets.token_hex(32)
        response.set_cookie(
            COOKIE_NAME,
            token,
            max_age=180 * 86400,
            httponly=True,
            samesite="lax",
            secure=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
            path="/",
        )
        return hashlib.sha256(token.encode()).hexdigest()

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/v1/catalog", response_model=CatalogResponse)
    def getCatalog(request: Request, response: Response):
        owner(request, response)
        catalog = loadCatalog()
        return {
            "version": catalog["version"],
            "cities": [citySummary(c) for c in catalog["cities"]],
        }

    @app.get("/api/v1/games/current", response_model=GameSnapshot)
    def getCurrent(request: Request, response: Response):
        return app.state.repository.current(owner(request, response))

    @app.post("/api/v1/games", response_model=GameSnapshot, status_code=201)
    def newGame(payload: NewGameRequest, request: Request, response: Response):
        return app.state.repository.create(
            owner(request, response),
            payload.initialCityId,
            str(payload.expectedGameId) if payload.expectedGameId else None,
            str(payload.requestId),
        )

    @app.post("/api/v1/games/current/actions", response_model=GameSnapshot)
    def act(payload: ActionRequest, request: Request, response: Response):
        return app.state.repository.action(
            owner(request, response),
            str(payload.gameId),
            str(payload.requestId),
            payload.expectedVersion,
            payload.action.model_dump(),
        )

    staticDir = Path(
        os.environ.get("STATIC_DIR", str(Path(__file__).resolve().parents[2] / "frontend" / "dist"))
    )
    if staticDir.exists():
        app.mount("/assets", StaticFiles(directory=staticDir / "assets"), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        def frontend(path: str):
            if path.startswith("api/"):
                return JSONResponse(status_code=404, content={"detail": "Ruta no encontrada."})
            return FileResponse(staticDir / "index.html")

    return app


app = createApp()
