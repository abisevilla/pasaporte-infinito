import { Link, type LinkProps } from "react-router-dom";
import type { Game, Scene } from "@/shared/types";
import { Button } from "../ui/button";
import { PagedReader } from "./paged-reader";

const reviewDateFormat = new Intl.DateTimeFormat("es", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function Sources({
  scene,
  onBack,
}: {
  scene: Scene;
  onBack: () => void;
}) {
  return (
    <section className="screen sources-screen">
      <div className="screen-heading">
        <h1 data-screen-title tabIndex={-1}>
          Fuentes de la escena
        </h1>
      </div>
      <div className="source-list">
        <h2>{scene.title}</h2>
        <ul>
          {scene.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <p>
                Revisada el{" "}
                {reviewDateFormat.format(new Date(source.reviewedAt))}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="screen-actions">
        <Button data-primary onClick={onBack}>
          Volver a la lectura
        </Button>
      </div>
    </section>
  );
}

export function Journal({
  game,
  index,
  onIndexChange,
  onBack,
  sourcesLink,
}: {
  game: Game;
  index: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  sourcesLink: (sceneId: string) => LinkProps;
}) {
  const entries = game.journal.flatMap((city) =>
    city.scenes.map((scene) => ({ city, scene })),
  );
  const entry = entries[Math.min(index, entries.length - 1)];
  return (
    <section className="screen journal-screen">
      <div className="screen-heading">
        <h1 data-screen-title tabIndex={-1}>
          Tu cuaderno de viaje
        </h1>
        {entry && (
          <p className="screen-description">
            Entrada {index + 1} de {entries.length}. {entry.city.name}
            {entry.city.stamped ? " (sello conseguido)." : "."}
          </p>
        )}
      </div>
      {entry ? (
        <>
          <h2 className="reading-title" aria-live="polite">
            {entry.scene.title}
          </h2>
          <PagedReader
            key={entry.scene.id}
            text={`${entry.scene.text}\n\n${entry.scene.detail}`}
            label="Entrada del cuaderno"
          />
        </>
      ) : (
        <PagedReader text="Aún no has registrado escenas. Vuelve a tu aventura para empezar a completar el cuaderno." />
      )}
      <div className="screen-actions">
        <Button
          variant="outline"
          data-screen-prev
          disabled={index === 0}
          onClick={() => onIndexChange(index - 1)}
        >
          ← Anterior
        </Button>
        <Button data-primary onClick={onBack}>
          Cerrar cuaderno
        </Button>
        {entry && (
          <Button asChild variant="outline">
            <Link id="scene-sources" {...sourcesLink(entry.scene.id)}>
              Fuentes
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          data-screen-next
          disabled={index >= entries.length - 1}
          onClick={() => onIndexChange(index + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </section>
  );
}
