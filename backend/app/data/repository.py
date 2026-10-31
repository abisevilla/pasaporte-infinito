"""Transacciones y control de concurrencia del estado y sus recibos."""

import hashlib
import json

from sqlalchemy import update

from app.business.game.engine import GameError, GameState, applyAction, createGame, publicState
from app.data.content import catalogForVersion, loadCatalog
from app.infrastructure.database import GameRow, GuestRow, ReceiptRow


class GameRepository:
    def __init__(self, sessionFactory):
        self.sessionFactory = sessionFactory

    def current(self, ownerHash: str) -> dict:
        with self.sessionFactory() as session:
            guest = session.get(GuestRow, ownerHash)
            if not guest or not guest.activeGameId:
                raise GameError("Todavía no tienes una partida guardada.", 404)
            row = session.get(GameRow, guest.activeGameId)
            state = GameState(**row.state)
            return publicState(state, catalogForVersion(state.contentVersion))

    def create(
        self, ownerHash: str, initialCityId: str, expectedGameId: str | None, requestId: str
    ) -> dict:
        catalog = loadCatalog()
        state = createGame(catalog, initialCityId)
        with self.sessionFactory.begin() as session:
            guest = session.get(GuestRow, ownerHash)
            if not guest:
                guest = GuestRow(sessionHash=ownerHash)
                session.add(guest)
                session.flush()
            if guest.activeGameId:
                old = session.get(GameRow, guest.activeGameId)
                receipt = session.get(ReceiptRow, (old.id, requestId))
                if receipt:
                    if receipt.requestHash != self.fingerprint(
                        {"initialCityId": initialCityId, "expectedGameId": expectedGameId}
                    ):
                        raise GameError("El identificador de solicitud ya fue utilizado.", 409)
                    return publicState(
                        GameState(**old.state), catalogForVersion(old.state["contentVersion"])
                    )
                if guest.activeGameId != expectedGameId:
                    raise GameError(
                        "La partida ha cambiado en otra pestaña. Recupera el progreso vigente.", 409
                    )
            elif expectedGameId:
                raise GameError("No se encuentra la partida que intentas sustituir.", 409)
            result = publicState(state, catalog)
            session.add(GameRow(id=state.id, ownerHash=ownerHash, version=0, state=state.toDict()))
            session.flush()
            guest.activeGameId = state.id
            session.add(
                ReceiptRow(
                    gameId=state.id,
                    requestId=requestId,
                    requestHash=self.fingerprint(
                        {"initialCityId": initialCityId, "expectedGameId": expectedGameId}
                    ),
                    response=result,
                )
            )
            return result

    def action(
        self, ownerHash: str, gameId: str, requestId: str, expectedVersion: int, action: dict
    ) -> dict:
        requestHash = self.fingerprint({"expectedVersion": expectedVersion, "action": action})
        with self.sessionFactory.begin() as session:
            guest = session.get(GuestRow, ownerHash)
            if not guest or guest.activeGameId != gameId:
                raise GameError("La partida solicitada no es la partida vigente.", 409)
            row = session.get(GameRow, gameId)
            receipt = session.get(ReceiptRow, (gameId, requestId))
            if receipt:
                if receipt.requestHash != requestHash:
                    raise GameError(
                        "El identificador de solicitud ya fue utilizado para otra acción.", 409
                    )
                return publicState(
                    GameState(**row.state), catalogForVersion(row.state["contentVersion"])
                )
            if row.version != expectedVersion:
                raise GameError(
                    "Tu partida cambió en otra pestaña. Se recuperará el estado más reciente.", 409
                )
            state = GameState(**row.state)
            catalog = catalogForVersion(state.contentVersion)
            updated = applyAction(state, action, catalog)
            count = session.execute(
                update(GameRow)
                .where(GameRow.id == gameId, GameRow.version == expectedVersion)
                .values(state=updated.toDict(), version=updated.version)
            ).rowcount
            if count != 1:
                raise GameError("Otra pestaña guardó una decisión. Recupera la partida.", 409)
            result = publicState(updated, catalog)
            session.add(
                ReceiptRow(
                    gameId=gameId, requestId=requestId, requestHash=requestHash, response=result
                )
            )
            return result

    @staticmethod
    def fingerprint(payload: dict) -> str:
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
