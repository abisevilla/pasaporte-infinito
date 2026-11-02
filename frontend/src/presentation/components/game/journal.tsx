import type { Game, Scene } from "@/shared/types";
import { Button } from "../ui/button";
import { PagedReader } from "./paged-reader";

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
        <p className="eyebrow">Archivo documental</p>
        <h1 data-screen-title tabIndex={-1}>
          Fuentes de la escena
        </h1>
      </div>
      <PagedReader
        key={scene.id}
        label="Fuentes"
        text={`${scene.title}\n\n${scene.sources.map((source) => `${source.title}\nRevisada: ${source.reviewedAt}\n${source.url}`).join("\n\n")}`}
      />
      <div className="screen-actions">
        <Button data-primary onClick={onBack}>
          Volver a la lectura
        </Button>
        {scene.sources.map((source, index) => (
          <Button asChild variant="outline" key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              Abrir fuente {index + 1} ↗
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
}

export function Journal({
  game,
  index,
  onIndexChange,
  onBack,
  onSources,
}: {
  game: Game;
  index: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  onSources: (scene: Scene) => void;
}) {
  const entries = game.journal.flatMap((city) =>
    city.scenes.map((scene) => ({ city, scene })),
  );
  const entry = entries[Math.min(index, entries.length - 1)];
  return (
    <section className="screen journal-screen">
      <div className="screen-heading">
        <p className="eyebrow">
          Archivo personal ·{" "}
          {entries.length ? `${index + 1} / ${entries.length}` : "Sin entradas"}
        </p>
        <h1 data-screen-title tabIndex={-1}>
          Tu cuaderno de viaje
        </h1>
        <p className="screen-description">
          {entry
            ? `${entry.city.name} · ${entry.city.stamped ? "Sello conseguido" : "En exploración"}`
            : "Registra escenas para conservarlas aquí."}
        </p>
      </div>
      {entry ? (
        <>
          <h2 className="reading-title">{entry.scene.title}</h2>
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
          <Button variant="outline" onClick={() => onSources(entry.scene)}>
            Fuentes
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
