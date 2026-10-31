import { Compass, Stamp } from "lucide-react";
import type { Game } from "@/shared/types";
import { Button } from "../ui/button";

export function PassportStamp({
  game,
  cityId,
  onContinue,
}: {
  game: Game;
  cityId: string;
  onContinue: () => void;
}) {
  const city = game.cities.find((city) => city.id === cityId)!;
  return (
    <section className="screen stamp-screen" aria-label="Sello del pasaporte">
      <div className="screen-heading">
        <p className="eyebrow">
          Destino completado · {game.stamps.length} de 3 sellos
        </p>
        <h1 data-screen-title tabIndex={-1}>
          ¡Ruta completada!
        </h1>
        <p className="screen-description" role="status">
          Has superado el desafío de {city.name}. Su sello ya está en tu
          pasaporte.
        </p>
      </div>
      <div className="stamping-stage" aria-hidden="true">
        <div className="open-passport">
          <div className="passport-page passport-identity">
            <Compass className="passport-compass" />
            <span className="passport-caption">PASAPORTE INFINITO</span>
            <h2>Tu viaje deja huella.</h2>
            <div className="earned-stamps">
              {game.journal
                .filter((city) => city.stamped && city.id !== cityId)
                .map((city) => (
                  <span key={city.id}>{city.name} ✓</span>
                ))}
            </div>
            <span className="passport-page-number">EXPLORACIÓN CULTURAL</span>
          </div>
          <div className="passport-page passport-stamp-page">
            <span className="passport-caption">VISADOS DE VIAJE</span>
            <div className="stamp-impression">
              <Compass size={28} strokeWidth={1.4} />
              <strong>{city.name}</strong>
              <span>DESTINO COMPLETADO</span>
              <b>✦ PASAPORTE INFINITO ✦</b>
            </div>
            <span className="stamp-impact" />
            <div className="stamp-tool">
              <Stamp strokeWidth={1.5} />
            </div>
            <span className="passport-page-number">
              SELLO {game.stamps.length} / 3
            </span>
          </div>
        </div>
      </div>
      <div className="screen-actions">
        <Button data-primary data-screen-next onClick={onContinue}>
          {game.status === "completed"
            ? "Ver mi epílogo →"
            : "Elegir siguiente destino →"}
        </Button>
      </div>
    </section>
  );
}
