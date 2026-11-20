import { useState } from "react";
import { Link, type LinkProps } from "react-router-dom";
import type { Game, GameAction } from "@/shared/types";
import { ConfirmDialog } from "../ui/confirm-dialog";
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
  sourcesLink,
  onRestart,
  journalLink,
  answerError,
  failedOptionId,
  onRetryAnswer,
  retryLabel,
}: {
  game: Game;
  readingSceneId: string | null;
  onSceneChange: (id: string) => void;
  pending: boolean;
  decide: (action: GameAction, onSuccess?: (game: Game) => void) => void;
  sourcesLink: (sceneId: string) => LinkProps;
  onRestart: () => void;
  journalLink: LinkProps;
  answerError?: string;
  failedOptionId?: string;
  onRetryAnswer: () => void;
  retryLabel: string;
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
  const selectedOption = failedOptionId ?? optionId;
  const registered = !!scene && game.exploredSceneIds.includes(scene.id);
  const registeredCount = game.scenes.filter((item) =>
    game.exploredSceneIds.includes(item.id),
  ).length;
  if (game.phase === "finished")
    return (
      <section className="screen ending-screen">
        <div className="screen-heading">
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
          <Button asChild variant="outline">
            <Link {...journalLink}>Abrir cuaderno de viaje</Link>
          </Button>
          <ConfirmDialog
            disabled={pending}
            onConfirm={onRestart}
            trigger={
              <Button data-primary disabled={pending}>
                Comenzar otra aventura
              </Button>
            }
          />
        </div>
      </section>
    );
  if (question)
    return (
      <section className="screen challenge-screen">
        <div className="screen-heading">
          <p className="screen-progress">
            {city.name}, pregunta {game.questionNumber} de 3
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
            <label key={option.id} className="answer-option">
              <input
                data-choice
                type="radio"
                name="answer"
                autoComplete="off"
                value={option.id}
                checked={selectedOption === option.id}
                disabled={!!failedOptionId}
                onChange={() => setOptionId(option.id)}
              />
              <span>
                {String.fromCharCode(65 + index)}. {option.text}
              </span>
            </label>
          ))}
        </fieldset>
        {answerError && (
          <p className="decision-error" id="answer-error" role="alert">
            {answerError}
          </p>
        )}
        <div className="screen-actions">
          <Button asChild variant="outline">
            <Link id="review-journal" {...journalLink}>
              Repasar cuaderno
            </Link>
          </Button>
          <Button
            data-primary
            disabled={!selectedOption || pending}
            aria-describedby={answerError ? "answer-error" : undefined}
            onClick={() => {
              if (answerError) {
                onRetryAnswer();
              } else if (selectedOption) {
                decide({
                  type: "answerQuestion",
                  questionId: question.id,
                  optionId: selectedOption,
                });
              }
            }}
          >
            {pending
              ? "Comprobando…"
              : answerError
                ? retryLabel
                : "Comprobar respuesta"}
          </Button>
        </div>
      </section>
    );
  return (
    <section className="screen exploration-screen">
      <div className="screen-heading">
        <p className="screen-progress">
          Destino {game.itinerary.length} de 3, escena {sceneIndex + 1} de 3.{" "}
          {registeredCount} de {game.scenes.length} registradas.
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
          <h2 className="reading-title" aria-live="polite">
            {scene.title}
          </h2>
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
        <Button asChild variant="outline">
          <Link id="scene-sources" {...sourcesLink(scene.id)}>
            Fuentes
          </Link>
        </Button>
        <Button
          data-primary
          disabled={pending || registered}
          onClick={() =>
            decide({ type: "exploreScene", sceneId: scene.id }, (updated) => {
              const next = updated.scenes.findIndex(
                (item) => !updated.exploredSceneIds.includes(item.id),
              );
              if (next >= 0) setSceneIndex(next);
            })
          }
        >
          {pending
            ? "Guardando…"
            : registered
              ? "Escena registrada"
              : `Registrar escena ${sceneIndex + 1} de 3`}
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
