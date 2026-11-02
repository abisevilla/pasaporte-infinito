"""Reglas puras del juego, sin dependencias de HTTP ni de almacenamiento."""

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from typing import Any
from uuid import uuid4


class GameError(Exception):
    def __init__(self, message: str, statusCode: int = 422):
        super().__init__(message)
        self.statusCode = statusCode


@dataclass
class GameState:
    id: str
    contentVersion: str
    initialCityId: str
    currentCityId: str
    currentSceneId: str
    version: int = 0
    status: str = "active"
    phase: str = "exploration"
    itinerary: list[str] = field(default_factory=list)
    exploredSceneIds: list[str] = field(default_factory=list)
    stamps: list[str] = field(default_factory=list)
    answeredQuestionIds: list[str] = field(default_factory=list)
    cityErrors: int = 0
    totalErrors: int = 0
    decisions: list[dict] = field(default_factory=list)
    answers: list[dict] = field(default_factory=list)
    feedback: dict | None = None

    def toDict(self) -> dict:
        return asdict(self)


def createGame(catalog: dict, initialCityId: str) -> GameState:
    city = getCity(catalog, initialCityId)
    return GameState(
        id=str(uuid4()),
        contentVersion=catalog["version"],
        initialCityId=initialCityId,
        currentCityId=initialCityId,
        currentSceneId=city["scenes"][0]["id"],
        itinerary=[initialCityId],
        decisions=[{"type": "start", "cityId": initialCityId}],
    )


def getCity(catalog: dict, cityId: str) -> dict:
    for city in catalog["cities"]:
        if city["id"] == cityId:
            return city
    raise GameError("La ciudad elegida no existe.")


def applyAction(state: GameState, action: dict, catalog: dict) -> GameState:
    if state.contentVersion != catalog["version"]:
        raise GameError("Esta partida necesita su versión de contenido original.", 409)
    if state.status != "active":
        raise GameError("La aventura ha terminado. Puedes comenzar una nueva.", 409)
    updated = deepcopy(state)
    updated.feedback = None
    city = getCity(catalog, state.currentCityId)
    actionType = action.get("type")
    if actionType == "exploreScene":
        sceneId = action.get("sceneId")
        if sceneId not in [scene["id"] for scene in city["scenes"]]:
            raise GameError("Esta escena no pertenece a tu ciudad actual.")
        updated.currentSceneId = sceneId
        if sceneId not in updated.exploredSceneIds:
            updated.exploredSceneIds.append(sceneId)
        if updated.phase == "exploration" and all(
            scene["id"] in updated.exploredSceneIds for scene in city["scenes"]
        ):
            updated.phase = "challenge"
    elif actionType == "answerQuestion":
        if state.phase != "challenge":
            raise GameError("Explora las tres escenas antes de responder al desafío.")
        question = next(
            (q for q in city["questions"] if q["id"] not in state.answeredQuestionIds), None
        )
        if not question or action.get("questionId") != question["id"]:
            raise GameError("Esta pregunta ya no está disponible.", 409)
        optionId = action.get("optionId")
        if optionId not in [option["id"] for option in question["options"]]:
            raise GameError("La opción elegida no existe.")
        correct = optionId == question["correctOptionId"]
        updated.answers.append(
            {"questionId": question["id"], "optionId": optionId, "correct": correct}
        )
        if correct:
            updated.answeredQuestionIds.append(question["id"])
        else:
            updated.cityErrors += 1
            updated.totalErrors += 1
        updated.feedback = {
            "correct": correct,
            "questionId": question["id"],
            "explanation": question["explanation"]
            if correct or updated.cityErrors >= 3
            else "Esa respuesta no es correcta. Puedes repasar las escenas del cuaderno y volver a intentarlo.",
        }
        if updated.cityErrors >= 3:
            updated.status = "failed"
            updated.phase = "finished"
        elif all(q["id"] in updated.answeredQuestionIds for q in city["questions"]):
            updated.stamps.append(city["id"])
            if len(updated.stamps) == 3:
                updated.status = "completed"
                updated.phase = "finished"
            else:
                updated.phase = "travel"
    elif actionType == "chooseRoute":
        if state.phase != "travel" or len(state.itinerary) >= 3:
            raise GameError("Todavía no puedes viajar a otra ciudad.")
        destination = getCity(catalog, action.get("cityId", ""))
        if destination["id"] in state.itinerary:
            raise GameError("Ya has visitado esta ciudad en la partida.")
        if destination["id"] not in catalog["routes"][state.currentCityId]:
            raise GameError("La ruta no está disponible.")
        updated.itinerary.append(destination["id"])
        updated.decisions.append(
            {"type": "travel", "from": state.currentCityId, "cityId": destination["id"]}
        )
        updated.currentCityId = destination["id"]
        updated.currentSceneId = destination["scenes"][0]["id"]
        updated.cityErrors = 0
        updated.phase = "exploration"
    else:
        raise GameError("Acción desconocida.")
    updated.version += 1
    return updated


def citySummary(city: dict) -> dict:
    return {
        key: city[key]
        for key in (
            "id",
            "name",
            "country",
            "region",
            "coordinates",
            "tagline",
            "description",
            "landmark",
            "stamp",
        )
    }


def publicState(state: GameState, catalog: dict) -> dict[str, Any]:
    city = getCity(catalog, state.currentCityId)
    cities = []
    for candidate in catalog["cities"]:
        cityId = candidate["id"]
        if cityId == state.currentCityId:
            status = "current"
        elif cityId in state.itinerary:
            status = "visited"
        elif len(state.itinerary) == 3 or state.status != "active":
            status = "discarded"
        elif state.phase == "travel" and cityId in catalog["routes"][state.currentCityId]:
            status = "available"
        else:
            status = "locked"
        cities.append({**citySummary(candidate), "mapStatus": status})
    question = None
    if state.phase == "challenge":
        current = next(q for q in city["questions"] if q["id"] not in state.answeredQuestionIds)
        question = {key: current[key] for key in ("id", "prompt", "options")}
    journal = []
    for cityId in state.itinerary:
        visited = getCity(catalog, cityId)
        journal.append(
            {
                **citySummary(visited),
                "stamped": cityId in state.stamps,
                "scenes": [s for s in visited["scenes"] if s["id"] in state.exploredSceneIds],
            }
        )
    return {
        "id": state.id,
        "version": state.version,
        "contentVersion": state.contentVersion,
        "initialCityId": state.initialCityId,
        "currentCityId": state.currentCityId,
        "currentSceneId": state.currentSceneId,
        "status": state.status,
        "phase": state.phase,
        "itinerary": state.itinerary,
        "exploredSceneIds": state.exploredSceneIds,
        "stamps": state.stamps,
        "cityErrors": state.cityErrors,
        "totalErrors": state.totalErrors,
        "cities": cities,
        "scenes": city["scenes"],
        "question": question,
        "questionNumber": sum(q["id"] in state.answeredQuestionIds for q in city["questions"]) + 1,
        "journal": journal,
        "feedback": state.feedback,
        "epilogue": buildEpilogue(state, catalog) if state.status == "completed" else None,
    }


def buildEpilogue(state: GameState, catalog: dict) -> str:
    cities = [getCity(catalog, cityId) for cityId in state.itinerary]
    names = " → ".join(city["name"] for city in cities)
    landmarks = ", ".join(city["landmark"] for city in cities)
    return (
        f"Tu itinerario: {names}. Tres ciudades, tres sellos y una colección de detalles "
        f"para volver a mirar: {landmarks}. Has completado los tres desafíos culturales. "
        "El cuaderno conserva las escenas y sus fuentes; tu próximo viaje puede empezar "
        "en cualquiera de las seis ciudades."
    )
