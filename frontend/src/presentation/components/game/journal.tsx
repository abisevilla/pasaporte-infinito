import { BookOpen, ExternalLink } from "lucide-react";
import type { Game, Scene } from "@/shared/types";
import { Button } from "../ui/button";

export function Sources({ scene }: { scene: Scene }) {
  return (
    <details className="sources">
      <summary>Consultar fuentes</summary>
      {scene.sources.map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
          {source.title} <ExternalLink size={12} />
          <small>Revisada: {source.reviewedAt}</small>
        </a>
      ))}
    </details>
  );
}

export function Journal({
  game,
  open,
  onToggle,
}: {
  game: Game;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="journal-section">
      <Button
        variant="outline"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="travel-journal"
      >
        <BookOpen size={17} />{" "}
        {open ? "Cerrar cuaderno" : "Abrir cuaderno de viaje"}
      </Button>
      {open && (
        <div id="travel-journal" className="journal">
          <p className="eyebrow">Archivo personal</p>
          <h2>Tu cuaderno de viaje</h2>
          <p>Las escenas que has explorado y sus fuentes, siempre a mano.</p>
          {game.journal.map((city) => (
            <article key={city.id}>
              <h3>
                {city.name}{" "}
                {city.stamped && <span className="small-stamp">Sellado</span>}
              </h3>
              {city.scenes.length === 0 && (
                <p>Aún no has registrado escenas de esta ciudad.</p>
              )}
              {city.scenes.map((scene) => (
                <section key={scene.id}>
                  <h4>{scene.title}</h4>
                  <p>{scene.text}</p>
                  <p className="detail-note">{scene.detail}</p>
                  <Sources scene={scene} />
                </section>
              ))}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
