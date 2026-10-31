import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Globe2,
  MapPin,
  Stamp,
  X,
} from "lucide-react";
import { useGame } from "@/business/game/use-game";
import type { City, Game, GameAction } from "@/shared/types";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { AtlasMap } from "../components/game/atlas-map";
import { LandmarkArt } from "../components/game/landmark-art";
import { Journal, Sources } from "../components/game/journal";

const statusLabels = {
  current: "Estás aquí",
  available: "Disponible",
  visited: "Visitada",
  locked: "Por descubrir",
  discarded: "Fuera de este viaje",
};

function DestinationPicker({
  cities,
  pending,
  onChoose,
  heading,
  actionLabel,
}: {
  cities: (City & { mapStatus?: Game["cities"][number]["mapStatus"] })[];
  pending: boolean;
  onChoose: (id: string) => void;
  heading: string;
  actionLabel: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cities.find((city) => city.id === selectedId);
  return (
    <>
      <AtlasMap
        cities={cities}
        selectedId={selectedId}
        onSelect={setSelectedId}
        disabled={pending}
      />
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tu viaje, tus coordenadas</p>
          <h2>{heading}</h2>
        </div>
        <span className="caption">Elige en el mapa o en la lista</span>
      </div>
      <div className="destination-grid" aria-label="Lista de destinos">
        {cities.map((city, index) => {
          const available = !city.mapStatus || city.mapStatus === "available";
          return (
            <button
              key={city.id}
              className={`destination-card ${selectedId === city.id ? "is-selected" : ""}`}
              disabled={!available || pending}
              aria-pressed={selectedId === city.id}
              aria-label={`Seleccionar ${city.name}${!available ? `: ${statusLabels[city.mapStatus!]}` : ""}`}
              onClick={() => setSelectedId(city.id)}
            >
              <div className="card-art">
                <span className="city-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <LandmarkArt cityId={city.id} />
                <span className="selection-dot">
                  {selectedId === city.id && <Check size={13} />}
                </span>
              </div>
              <div className="card-copy">
                <span>{city.country}</span>
                <h3>{city.name}</h3>
                <p>{city.tagline}</p>
                {city.mapStatus && (
                  <small>{statusLabels[city.mapStatus]}</small>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="departure-bar">
        <div>
          <p className="eyebrow">
            {selected ? "Próximo destino" : "Todo comienza con una elección"}
          </p>
          <strong>
            {selected
              ? `${selected.name} · ${selected.landmark}`
              : "¿Dónde empieza tu historia?"}
          </strong>
        </div>
        <Button
          disabled={!selected || pending}
          onClick={() => selected && onChoose(selected.id)}
        >
          {pending ? "Guardando…" : actionLabel}
          <ArrowRight size={17} />
        </Button>
      </div>
    </>
  );
}

function Adventure({
  game,
  pending,
  decide,
}: {
  game: Game;
  pending: boolean;
  decide: (action: GameAction) => void;
}) {
  const [optionId, setOptionId] = useState<string | null>(null);
  const city = game.cities.find((city) => city.id === game.currentCityId)!;
  const scene = game.scenes.find((scene) => scene.id === game.currentSceneId)!;
  const cityExploredCount = game.scenes.filter((item) =>
    game.exploredSceneIds.includes(item.id),
  ).length;
  if (game.phase === "travel")
    return (
      <div className="travel-phase">
        <div className="phase-intro">
          <span className="stamp-mark">
            <Stamp size={26} />
          </span>
          <p className="eyebrow">Sello conseguido · {city.name}</p>
          <h1>
            Una ciudad en tu pasaporte.
            <br />
            Otra historia en el horizonte.
          </h1>
          <p>
            Has superado el desafío. Elige un destino que aún no hayas visitado.
          </p>
        </div>
        <DestinationPicker
          cities={game.cities}
          heading="Traza el siguiente tramo"
          actionLabel="Viajar a esta ciudad"
          pending={pending}
          onChoose={(id) => decide({ type: "chooseRoute", cityId: id })}
        />
      </div>
    );
  if (game.phase === "finished")
    return (
      <div className="ending">
        <p className="eyebrow">
          {game.status === "completed"
            ? "Pasaporte completo"
            : "Una pausa en el camino"}
        </p>
        <h1>
          {game.status === "completed"
            ? "Hay viajes que se quedan contigo."
            : "Este viaje termina aquí."}
        </h1>
        <p>
          {game.epilogue ??
            "Has alcanzado tres errores en esta ciudad. Puedes repasar tu cuaderno y comenzar otra aventura desde cualquiera de los seis destinos."}
        </p>
        <div className="ending-stamps">
          {game.journal.map((city) => (
            <article key={city.id}>
              <LandmarkArt cityId={city.id} />
              <h3>{city.name}</h3>
              <span>{city.stamped ? "Sello conseguido" : "Sin sello"}</span>
            </article>
          ))}
        </div>
        <p className="detail-note">
          Tu recorrido: {game.journal.map((city) => city.name).join(" → ")}
        </p>
      </div>
    );
  return (
    <div className="adventure-layout">
      <aside className="city-panel">
        <p className="eyebrow">Destino {game.itinerary.length} / 3</p>
        <h1>{city.name}</h1>
        <p className="country-line">
          <MapPin size={14} />
          {city.country}
        </p>
        <LandmarkArt cityId={city.id} />
        <h3>{city.landmark}</h3>
        <p>{city.tagline}</p>
        <div className="scene-navigation" aria-label="Escenas de la ciudad">
          {game.scenes.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              className={scene.id === item.id ? "active-scene" : ""}
              disabled={pending}
              onClick={() => decide({ type: "exploreScene", sceneId: item.id })}
            >
              <span className="scene-index">
                {game.exploredSceneIds.includes(item.id) ? (
                  <Check size={14} />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <span>{item.title}</span>
              <ChevronRight size={14} />
            </Button>
          ))}
        </div>
        <p className="detail-note">
          Explora las tres escenas para abrir el desafío. Puedes volver a
          consultarlas cuando quieras.
        </p>
      </aside>
      <div className="reading-panel">
        <article className="scene-article">
          <p className="eyebrow">{scene.eyebrow}</p>
          <h2>{scene.title}</h2>
          <p className="scene-text">{scene.text}</p>
          <div className="observation">
            <Compass size={22} />
            <p>{scene.detail}</p>
          </div>
          <Sources scene={scene} />
          {game.phase === "exploration" && (
            <Button
              className="read-action"
              disabled={pending}
              onClick={() =>
                decide({
                  type: "exploreScene",
                  sceneId:
                    game.scenes.find(
                      (item) => !game.exploredSceneIds.includes(item.id),
                    )?.id ?? scene.id,
                })
              }
            >
              Registrar escena {cityExploredCount + 1} de 3
              <ArrowRight size={16} />
            </Button>
          )}
        </article>
        {game.question && (
          <section className="challenge" aria-labelledby="challenge-title">
            <p className="eyebrow">
              Desafío cultural · Pregunta {game.questionNumber} de 3
            </p>
            <h2 id="challenge-title">{game.question.prompt}</h2>
            <fieldset disabled={pending}>
              <legend className="sr-only">Elige una respuesta</legend>
              {game.question.options.map((option, index) => (
                <label
                  key={option.id}
                  className={
                    optionId === option.id
                      ? "answer-option chosen"
                      : "answer-option"
                  }
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.id}
                    checked={optionId === option.id}
                    onChange={() => setOptionId(option.id)}
                  />
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.text}
                </label>
              ))}
            </fieldset>
            <Button
              disabled={!optionId || pending}
              onClick={() => {
                if (game.question && optionId) {
                  decide({
                    type: "answerQuestion",
                    questionId: game.question.id,
                    optionId,
                  });
                  setOptionId(null);
                }
              }}
            >
              Comprobar respuesta
              <ArrowRight size={16} />
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}

export function GameScreen() {
  const { catalog, current, create, action, decide, pending } = useGame();
  const [choosingNew, setChoosingNew] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const navigate = useNavigate();
  const game = current.data;
  const error = create.error ?? action.error;
  const choosing = choosingNew || !game;
  useEffect(() => {
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [game?.id, game?.currentCityId, game?.phase, choosingNew]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <header className="site-header">
        <Link to="/" className="wordmark">
          <span className="brand-symbol">
            <Compass size={25} />
          </span>
          <span>
            PASAPORTE<span>INFINITO</span>
          </span>
        </Link>
        <div className="header-right">
          <span className="header-caption">Una aventura cultural</span>
          {game && (
            <ConfirmDialog
              disabled={pending}
              onConfirm={() => {
                setChoosingNew(true);
                create.reset();
                action.reset();
              }}
            />
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {(catalog.isLoading ||
          current.isLoading ||
          (catalog.isSuccess && current.isPending)) && (
          <div className="loading-state" role="status">
            <Compass size={35} />
            <p>Desplegando el atlas…</p>
          </div>
        )}
        {(catalog.isError || current.isError) && (
          <div className="error-banner" role="alert">
            <p>{(catalog.error ?? current.error)?.message}</p>
            <Button
              onClick={() => {
                void catalog.refetch();
                void current.refetch();
              }}
            >
              Reintentar conexión
            </Button>
          </div>
        )}
        {catalog.data && !current.isPending && !current.isError && (
          <>
            {choosing ? (
              <>
                <section className="welcome">
                  <div className="welcome-copy">
                    <p className="eyebrow">
                      <span /> El mundo tiene historias. Encuentra la tuya.
                    </p>
                    <h1>
                      Seis ciudades.
                      <br />
                      Tres sellos.
                      <br />
                      <em>Tu propio camino.</em>
                    </h1>
                    <p className="welcome-description">
                      De los detalles que pasan desapercibidos a los lugares que
                      siempre quisiste conocer. Abre tu pasaporte y descubre lo
                      que hay detrás de cada destino.
                    </p>
                    <div className="welcome-facts">
                      <span>
                        <Globe2 size={17} /> 6 destinos reales
                      </span>
                      <span>
                        <Stamp size={17} /> 3 ciudades por viaje
                      </span>
                      <span>
                        <BookOpen size={17} /> A tu ritmo
                      </span>
                    </div>
                  </div>
                  <div className="passport-cover">
                    <div className="cover-border">
                      <span>CUADERNO DE EXPLORACIÓN</span>
                      <Compass size={78} strokeWidth={1} />
                      <h2>
                        Pasaporte
                        <br />
                        <em>Infinito</em>
                      </h2>
                      <div className="cover-rule" />
                      <span>EL VIAJE EMPIEZA CONTIGO</span>
                      <div className="passport-corners">
                        ✦ &nbsp; &nbsp; ✦ &nbsp; &nbsp; ✦
                      </div>
                    </div>
                    <div className="passport-sticker">
                      120 formas
                      <br />
                      <strong>de descubrir</strong>
                    </div>
                  </div>
                </section>
                <div className="how-it-works">
                  <span>
                    <b>01</b> Elige tu origen
                  </span>
                  <ArrowRight size={16} />
                  <span>
                    <b>02</b> Explora y supera el desafío
                  </span>
                  <ArrowRight size={16} />
                  <span>
                    <b>03</b> Reúne tres sellos
                  </span>
                </div>
                {game && (
                  <div className="resume-note">
                    <p>
                      Tu partida actual se conserva hasta que comiences el nuevo
                      viaje.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setChoosingNew(false)}
                    >
                      Volver a mi partida
                    </Button>
                  </div>
                )}
                <DestinationPicker
                  key={game?.id ?? "first-game"}
                  cities={catalog.data.cities}
                  heading="Elige dónde comienza todo"
                  actionLabel="Comenzar mi viaje"
                  pending={pending}
                  onChoose={(initialCityId) =>
                    create.mutate(
                      {
                        initialCityId,
                        expectedGameId: game?.id ?? null,
                        requestId: crypto.randomUUID(),
                      },
                      {
                        onSuccess: () => {
                          setChoosingNew(false);
                          setJournalOpen(false);
                          navigate("/viaje");
                          window.scrollTo({ top: 0, behavior: "instant" });
                        },
                      },
                    )
                  }
                />
                <p className="rules-note">
                  Tres escenas y tres preguntas por ciudad. El tercer error en
                  un destino termina la aventura. Los errores se reinician al
                  viajar. El progreso se guarda automáticamente en este
                  navegador mientras conserves su cookie.
                </p>
              </>
            ) : (
              <>
                <div className="game-hud">
                  <div className="itinerary">
                    <p className="eyebrow">Tu itinerario</p>
                    <span>
                      {game.journal.map((city, index) => (
                        <span key={city.id}>
                          {index > 0 && <ArrowRight size={12} />} {city.name}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="hud-metrics">
                    <span>
                      <Stamp size={17} />
                      <strong>{game.stamps.length}/3</strong> sellos
                    </span>
                    <span
                      aria-label={`${game.cityErrors} de 3 errores en esta ciudad`}
                    >
                      <X size={17} />
                      <strong>{game.cityErrors}/3</strong> errores
                    </span>
                    <span className="save-status" role="status">
                      {pending
                        ? "Guardando…"
                        : error
                          ? "Sin confirmar"
                          : "Guardado"}
                    </span>
                  </div>
                </div>
                {game.feedback && (
                  <div
                    className={`feedback ${game.feedback.correct ? "correct" : "incorrect"}`}
                    role="status"
                  >
                    <strong>
                      {game.feedback.correct
                        ? "¡Respuesta correcta!"
                        : "Respuesta incorrecta."}
                    </strong>{" "}
                    {game.feedback.explanation}
                  </div>
                )}
                <Adventure
                  key={`${game.id}-${game.currentCityId}-${game.phase}`}
                  game={game}
                  pending={pending}
                  decide={decide}
                />
                {game.phase === "finished" && (
                  <div className="ending-action">
                    <Button onClick={() => setChoosingNew(true)}>
                      Comenzar otra aventura
                      <ArrowRight size={17} />
                    </Button>
                  </div>
                )}
                <Journal
                  game={game}
                  open={journalOpen}
                  onToggle={() => setJournalOpen((value) => !value)}
                />
              </>
            )}
            {error && (
              <div className="error-banner" role="alert">
                <strong>No se pudo completar la decisión.</strong>
                <p>{error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    create.reset();
                    action.reset();
                    void current.refetch();
                  }}
                >
                  Recuperar progreso
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="site-footer">
        <span>
          <Compass size={17} /> PASAPORTE INFINITO
        </span>
        <p>La curiosidad es el mejor punto de partida.</p>
        <small>Hechos reales · Fuentes abiertas en cada escena</small>
      </footer>
    </div>
  );
}
