"""Pruebas HTTP de guardado, aislamiento y decisiones concurrentes."""

from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from app.main import createApp


@pytest.fixture
def application(tmp_path, monkeypatch):
    databaseUrl = f"sqlite:///{tmp_path / 'game.sqlite3'}"
    monkeypatch.setenv("DATABASE_URL", databaseUrl)
    from pathlib import Path

    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    app = createApp(databaseUrl)
    with TestClient(app) as client:
        yield app, client


def start(client):
    catalog = client.get("/api/v1/catalog")
    assert catalog.status_code == 200
    assert len(catalog.json()["cities"]) == 6
    payload = {"initialCityId": "madrid", "requestId": str(uuid4())}
    response = client.post("/api/v1/games", json=payload)
    assert response.status_code == 201
    return response.json(), payload


def actionPayload(state):
    return {
        "gameId": state["id"],
        "requestId": str(uuid4()),
        "expectedVersion": state["version"],
        "action": {"type": "exploreScene", "sceneId": state["scenes"][0]["id"]},
    }


def testRecoveryIsolationAndIdempotency(application):
    app, client = application
    state, creation = start(client)
    assert client.post("/api/v1/games", json=creation).json()["id"] == state["id"]
    payload = actionPayload(state)
    saved = client.post("/api/v1/games/current/actions", json=payload)
    assert saved.status_code == 200
    assert saved.json()["version"] == 1
    assert client.post("/api/v1/games/current/actions", json=payload).json() == saved.json()
    payload["action"]["sceneId"] = state["scenes"][1]["id"]
    assert client.post("/api/v1/games/current/actions", json=payload).status_code == 409
    with TestClient(app) as stranger:
        assert stranger.get("/api/v1/games/current").status_code == 404
        assert (
            stranger.post("/api/v1/games/current/actions", json=actionPayload(state)).status_code
            == 409
        )
    databaseUrl = str(app.state.engine.url)
    with TestClient(createApp(databaseUrl)) as recovered:
        recovered.cookies.update(client.cookies)
        assert recovered.get("/api/v1/games/current").json() == saved.json()
    assert "httponly" in client.get("/api/v1/catalog").headers["set-cookie"].lower()
    assert "correctOptionId" not in str(saved.json())


def testStaleVersionsAndReplacement(application):
    _, client = application
    state, _ = start(client)
    payload = actionPayload(state)
    assert client.post("/api/v1/games/current/actions", json=payload).status_code == 200
    payload["requestId"] = str(uuid4())
    assert client.post("/api/v1/games/current/actions", json=payload).status_code == 409
    replacement = {
        "initialCityId": "paris",
        "expectedGameId": state["id"],
        "requestId": str(uuid4()),
    }
    fresh = client.post("/api/v1/games", json=replacement)
    assert fresh.status_code == 201
    assert fresh.json()["initialCityId"] == "paris"
    assert fresh.json()["version"] == 0
    assert client.post("/api/v1/games/current/actions", json=payload).status_code == 409


def testConcurrentDecisionsHaveOnlyOneWinner(application):
    _, client = application
    state, _ = start(client)
    payloads = [actionPayload(state), actionPayload(state)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(
                lambda payload: client.post("/api/v1/games/current/actions", json=payload), payloads
            )
        )
    assert sorted(response.status_code for response in responses) == [200, 409]
    assert client.get("/api/v1/games/current").json()["version"] == 1


def testConcurrentCreationIsIdempotent(application):
    _, client = application
    client.get("/api/v1/catalog")
    payload = {"initialCityId": "rome", "requestId": str(uuid4())}
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: client.post("/api/v1/games", json=payload), range(2)))
    assert [response.status_code for response in responses] == [201, 201]
    assert responses[0].json()["id"] == responses[1].json()["id"]


def testOriginAndInvalidContracts(application):
    _, client = application
    payload = {"initialCityId": "madrid", "requestId": str(uuid4())}
    assert (
        client.post(
            "/api/v1/games", json=payload, headers={"Origin": "https://foreign.example"}
        ).status_code
        == 403
    )
    payload["correctOptionId"] = "forged"
    assert client.post("/api/v1/games", json=payload).status_code == 422
