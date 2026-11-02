"""Carga y validación del grafo documental versionado."""

import json
from datetime import date
from pathlib import Path

from app.business.game.engine import GameError

CONTENT_PATH = Path(__file__).parent / "content" / "v1.json"


def loadCatalog(path: Path = CONTENT_PATH) -> dict:
    catalog = json.loads(path.read_text(encoding="utf-8"))
    cityIds = [city["id"] for city in catalog["cities"]]
    if len(cityIds) != len(set(cityIds)) or len(cityIds) < 3:
        raise ValueError("El catálogo necesita al menos tres ciudades con identificadores únicos.")
    identifiers = []
    for city in catalog["cities"]:
        lon, lat = city["coordinates"]
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError("Coordenadas fuera de rango.")
        if len(city["scenes"]) != 3 or len(city["questions"]) != 3:
            raise ValueError("Cada ciudad necesita tres escenas y tres preguntas.")
        for scene in city["scenes"]:
            identifiers.append(scene["id"])
            if not scene["text"] or not scene["sources"]:
                raise ValueError("Las escenas deben tener texto y fuentes.")
            validateSources(scene["sources"])
        for question in city["questions"]:
            identifiers.append(question["id"])
            options = [option["id"] for option in question["options"]]
            if (
                len(options) != 4
                or len(set(options)) != 4
                or question["correctOptionId"] not in options
            ):
                raise ValueError("Cada pregunta necesita cuatro opciones y una respuesta válida.")
            if not question["explanation"]:
                raise ValueError("Las preguntas necesitan una explicación.")
            validateSources(question["sources"])
        routes = catalog["routes"].get(city["id"], [])
        if set(routes) != set(cityIds) - {city["id"]} or len(routes) != len(set(routes)):
            raise ValueError("El grafo inicial debe conectar todas las ciudades distintas.")
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("Los identificadores de contenido deben ser únicos.")
    return catalog


def validateSources(sources: list[dict]) -> None:
    if not sources:
        raise ValueError("Falta una fuente documental.")
    for source in sources:
        if not source["url"].startswith("https://") or not source["title"]:
            raise ValueError("Fuente documental inválida.")
        date.fromisoformat(source["reviewedAt"])


def catalogForVersion(version: str) -> dict:
    if version != "1.0.0":
        raise GameError("La versión de contenido de esta partida no está instalada.", 409)
    return loadCatalog()
