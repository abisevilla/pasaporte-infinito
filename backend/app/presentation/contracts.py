"""Contratos HTTP públicos, sin respuestas correctas ni reglas privadas."""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Source(Contract):
    title: str
    url: str
    reviewedAt: str


class Scene(Contract):
    id: str
    title: str
    eyebrow: str
    text: str
    detail: str
    sources: list[Source]


class City(Contract):
    id: str
    name: str
    country: str
    region: Literal["europe", "usa"]
    coordinates: tuple[float, float]
    tagline: str
    description: str
    landmark: str
    stamp: str


class MapCity(City):
    mapStatus: Literal["current", "visited", "available", "locked", "discarded"]


class JournalCity(City):
    stamped: bool
    scenes: list[Scene]


class Option(Contract):
    id: str
    text: str


class Question(Contract):
    id: str
    prompt: str
    options: list[Option]


class Feedback(Contract):
    correct: bool
    questionId: str
    explanation: str


class GameSnapshot(Contract):
    id: str
    version: int
    contentVersion: str
    initialCityId: str
    currentCityId: str
    currentSceneId: str
    status: Literal["active", "completed", "failed"]
    phase: Literal["exploration", "challenge", "travel", "finished"]
    itinerary: list[str]
    exploredSceneIds: list[str]
    stamps: list[str]
    cityErrors: int
    totalErrors: int
    cities: list[MapCity]
    scenes: list[Scene]
    question: Question | None
    questionNumber: int
    journal: list[JournalCity]
    feedback: Feedback | None


class CatalogResponse(Contract):
    version: str
    cities: list[City]


class NewGameRequest(Contract):
    initialCityId: str = Field(min_length=1, max_length=60)
    expectedGameId: UUID | None = None
    requestId: UUID


class ExploreAction(Contract):
    type: Literal["exploreScene"]
    sceneId: str


class AnswerAction(Contract):
    type: Literal["answerQuestion"]
    questionId: str
    optionId: str


class TravelAction(Contract):
    type: Literal["chooseRoute"]
    cityId: str


class ActionRequest(Contract):
    gameId: UUID
    requestId: UUID
    expectedVersion: int = Field(ge=0)
    action: Annotated[ExploreAction | AnswerAction | TravelAction, Field(discriminator="type")]
