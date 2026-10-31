"""Verifica el contrato del juego en todos los itinerarios permitidos."""

from itertools import permutations

import pytest

from app.business.game.engine import GameError, applyAction, createGame, getCity, publicState
from app.data.content import loadCatalog
from app.presentation.contracts import GameSnapshot

catalog = loadCatalog()
cityIds = [city["id"] for city in catalog["cities"]]


def exploreCity(state):
    for scene in getCity(catalog, state.currentCityId)["scenes"]:
        state = applyAction(state, {"type": "exploreScene", "sceneId": scene["id"]}, catalog)
    return state


def completeCity(state):
    state = exploreCity(state)
    for question in getCity(catalog, state.currentCityId)["questions"]:
        state = applyAction(
            state,
            {
                "type": "answerQuestion",
                "questionId": question["id"],
                "optionId": question["correctOptionId"],
            },
            catalog,
        )
    return state


@pytest.mark.parametrize("itinerary", list(permutations(cityIds, 3)))
def testEveryItineraryCompletesWithThreeStamps(itinerary):
    state = createGame(catalog, itinerary[0])
    for index, cityId in enumerate(itinerary):
        if index:
            state = applyAction(state, {"type": "chooseRoute", "cityId": cityId}, catalog)
        state = completeCity(state)
        snapshot = publicState(state, catalog)
        GameSnapshot.model_validate(snapshot)
        assert "correctOptionId" not in str(snapshot)
        if index < 2:
            assert state.phase == "travel"
            assert sum(city["mapStatus"] == "available" for city in snapshot["cities"]) == 5 - index
    assert state.itinerary == list(itinerary)
    assert state.stamps == list(itinerary)
    assert state.status == "completed"
    assert all(getCity(catalog, cityId)["name"] in snapshot["epilogue"] for cityId in itinerary)
    assert sum(city["mapStatus"] == "discarded" for city in snapshot["cities"]) == 3
    with pytest.raises(GameError):
        applyAction(state, {"type": "chooseRoute", "cityId": cityIds[0]}, catalog)


def wrongAnswer(state):
    question = getCity(catalog, state.currentCityId)["questions"][0]
    wrongOption = next(
        option["id"]
        for option in question["options"]
        if option["id"] != question["correctOptionId"]
    )
    return applyAction(
        state,
        {"type": "answerQuestion", "questionId": question["id"], "optionId": wrongOption},
        catalog,
    )


def testThirdErrorEndsGameAndRestartAllowsEveryOrigin():
    state = exploreCity(createGame(catalog, cityIds[0]))
    for count in range(1, 4):
        state = wrongAnswer(state)
        assert state.cityErrors == count
        assert state.status == ("failed" if count == 3 else "active")
    with pytest.raises(GameError):
        wrongAnswer(state)
    for cityId in cityIds:
        fresh = createGame(catalog, cityId)
        assert fresh.cityErrors == 0
        assert fresh.itinerary == [cityId]
        assert not fresh.stamps


def testErrorsResetAndInputStateIsNotMutated():
    initial = createGame(catalog, cityIds[0])
    state = wrongAnswer(exploreCity(initial))
    assert initial.version == 0 and not initial.exploredSceneIds
    state = completeCity(state)
    state = applyAction(state, {"type": "chooseRoute", "cityId": cityIds[1]}, catalog)
    assert state.cityErrors == 0
    assert state.totalErrors == 1
    assert state.phase == "exploration"


def testInvalidTransitionsAreRejected():
    state = createGame(catalog, cityIds[0])
    with pytest.raises(GameError):
        wrongAnswer(state)
    with pytest.raises(GameError):
        applyAction(state, {"type": "chooseRoute", "cityId": cityIds[1]}, catalog)
    with pytest.raises(GameError):
        applyAction(state, {"type": "exploreScene", "sceneId": "foreign-scene"}, catalog)
    state = completeCity(state)
    with pytest.raises(GameError):
        applyAction(state, {"type": "chooseRoute", "cityId": cityIds[0]}, catalog)
