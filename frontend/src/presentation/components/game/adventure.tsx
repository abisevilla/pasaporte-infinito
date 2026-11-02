import { useState } from "react";
import type { Game, GameAction, Scene } from "@/shared/types";
import { Button } from "../ui/button";
import { PagedReader } from "./paged-reader";
import { JourneyEndArt } from "./journey-end-art";
import { LandmarkArt } from "./landmark-art";

export function Adventure({
  game,
  readingSceneId,
  onSceneChange,
  pending,
  decide,
  onSources,
  onRestart,
  onJournal,
}: {
  game: Game;
  readingSceneId: string | null;
  onSceneChange: (id: string) => void;
  pending: boolean;
  decide: (action: GameAction, onSuccess?: (game: Game) => void) => void;
  onSources: (scene: Scene) => void;
  onRestart: () => void;
  onJournal: () => void;
}) {
  const firstUnread = game.scenes.findIndex(
    (scene) => !game.exploredSceneIds.includes(scene.id),
  );
  const chosenIndex = game.scenes.findIndex(
    (scene) => scene.id === readingSceneId,
  );
  const sceneIndex =
    chosenIndex >= 0 ? chosenIndex : firstUnread < 0 ? 0 : firstUnread;
  const setSceneIndex = (index: number) => onSceneChange(game.scenes[index].id);
  const [optionId, setOptionId] = useState<string | null>(null);
  const city = game.cities.find((city) => city.id === game.currentCityId)!;
  const scene = game.scenes[sceneIndex];
  const question = game.question;
  if (game.phase === "finished")
    return (
      <section
        className={`screen ending-screen ${game.status === "failed" ? "is-failed" : ""}`}
      >
        <div className="screen-heading">
          <p className="eyebrow">
            {game.status === "completed"
              ? "Pasaporte completo"
              : "Una pausa en el camino"}
          </p>
          <h1 data-screen-title tabIndex={-1}>
            {game.status === "completed"
              ? "Hay viajes que se quedan contigo."
              : "Este viaje termina aquí."}
          </h1>
        </div>
        <div className="stamp-strip">
          {game.journal.map((city) => (
            <span key={city.id}>
              {city.name} · {city.stamped ? "Sellado" : "Sin sello"}
            </span>
          ))}
        </div>
        {game.status === "failed" ? (
          <div className="failure-ending-body">
            <JourneyEndArt />
            <PagedReader
              label="Fin del viaje"
              text="Has alcanzado tres errores en esta ciudad. Puedes repasar tu cuaderno y comenzar otra aventura desde cualquiera de los seis destinos."
            />
          </div>
        ) : (
          <PagedReader
            label="Epílogo"
            text={game.epilogue ?? "Has completado tu aventura."}
          />
        )}
        <div className="screen-actions">
          <Button variant="outline" onClick={onJournal}>
            Abrir cuaderno de viaje
          </Button>
          <Button data-primary onClick={onRestart}>
            Comenzar otra aventura
          </Button>
        </div>
      </section>
    );
  if (question)
    return (
      <section className="screen challenge-screen">
        <div className="screen-heading">
          <p className="eyebrow">
            {city.name} · Pregunta {game.questionNumber} de 3
          </p>
          <h1 data-screen-title tabIndex={-1}>
            {question.prompt}
          </h1>
        </div>
        <fieldset className="answer-grid" disabled={pending}>
          <legend className="sr-only">
            Elige una respuesta con las flechas y confirma con Enter
          </legend>
          {question.options.map((option, index) => (
            <label
              key={option.id}
              className={`answer-option ${optionId === option.id ? "chosen" : ""}`}
            >
              <input
                data-choice
                type="radio"
                name="answer"
                value={option.id}
                checked={optionId === option.id}
                onChange={() => setOptionId(option.id)}
              />
              <span>
                {String.fromCharCode(65 + index)}. {option.text}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="screen-actions">
          <Button variant="outline" onClick={onJournal}>
            Repasar cuaderno
          </Button>
          <Button
            data-primary
            disabled={!optionId || pending}
            onClick={() => {
              if (optionId) {
                decide({
                  type: "answerQuestion",
                  questionId: question.id,
                  optionId,
                });
                setOptionId(null);
              }
            }}
          >
            Comprobar respuesta
          </Button>
        </div>
      </section>
    );
  return (
    <section className="screen exploration-screen">
      <div className="screen-heading">
        <p className="eyebrow">
          Destino {game.itinerary.length} de 3 · Escena {sceneIndex + 1} de 3
        </p>
        <h1 data-screen-title tabIndex={-1}>
          {city.name}
        </h1>
      </div>
      <div className="exploration-body">
        <aside className="landmark-panel">
          <LandmarkArt cityId={city.id} />
          <h2>{city.landmark}</h2>
          <span>{city.country}</span>
        </aside>
        <article className="scene-reading">
          <h2 className="reading-title">{scene.title}</h2>
          <PagedReader
            key={scene.id}
            label="Escena"
            text={`${scene.text}\n\n${scene.detail}`}
          />
        </article>
      </div>
      <div className="screen-actions">
        <Button
          data-screen-prev
          variant="outline"
          disabled={sceneIndex === 0}
          onClick={() => setSceneIndex(sceneIndex - 1)}
        >
          ← Anterior
        </Button>
        <Button variant="outline" onClick={() => onSources(scene)}>
          Fuentes
        </Button>
        <Button
          data-primary
          disabled={pending}
          onClick={() =>
            decide({ type: "exploreScene", sceneId: scene.id }, (updated) => {
              const next = updated.scenes.findIndex(
                (item) => !updated.exploredSceneIds.includes(item.id),
              );
              if (next >= 0) setSceneIndex(next);
            })
          }
        >
          Registrar escena {sceneIndex + 1} de 3
        </Button>
        <Button
          data-screen-next
          variant="outline"
          disabled={sceneIndex === 2}
          onClick={() => setSceneIndex(sceneIndex + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </section>
  );
}
