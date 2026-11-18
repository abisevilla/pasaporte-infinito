import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useGame } from "@/business/game/use-game";
import type { GameAction } from "@/shared/types";
import { useKeyboardNavigation } from "../hooks/use-keyboard-navigation";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { AtlanticChart } from "../components/game/atlantic-chart";
import { AtlasMap } from "../components/game/atlas-map";
import { Adventure } from "../components/game/adventure";
import { DestinationPicker } from "../components/game/destination-picker";
import { Journal, Sources } from "../components/game/journal";
import { PagedReader } from "../components/game/paged-reader";
import { PassportStamp } from "../components/game/passport-stamp";
import { KeyboardGuide } from "../components/game/keyboard-guide";

const screens = [
  "home",
  "welcome",
  "destinations",
  "help",
  "journal",
  "sources",
  "map",
  "stamp",
  "feedback",
  "adventure",
] as const;
type Screen = (typeof screens)[number];

function screenUrl(screen: Screen, sceneId?: string, originMap = false) {
  const params = new URLSearchParams();
  if (screen !== "home") params.set("pantalla", screen);
  if (sceneId) params.set("fuente", sceneId);
  if (originMap) params.set("modo", "origen");
  return { search: params.toString() };
}

function isScreen(value: string | null): value is Screen {
  return screens.some((screen) => screen === value);
}
const helpText =
  "↑ / ↓: elegir una ciudad o respuesta. Si no hay opciones, mover el foco entre los controles.\n\n← / →: cambiar de escena, entrada del cuaderno o página de texto. En destinos cambian la ciudad seleccionada. Navegar por una escena no la registra.\n\nEnter: confirmar la opción elegida o activar el botón enfocado. Espacio: activar un botón o marcar una respuesta. Tab / Mayús + Tab: recorrer todos los controles.\n\nEscape o Retroceso: volver. H o ?: abrir esta ayuda. J: abrir o cerrar el cuaderno. Inicio / Fin: primera o última opción. Re Pág / Av Pág: cambiar de página de texto.\n\nTres escenas y tres preguntas por ciudad. Debes registrar las tres escenas para abrir el desafío. El tercer error en una ciudad termina la aventura; el contador se reinicia al viajar. Tres sellos completan tu itinerario.\n\nEl progreso se guarda en el servidor. Conserva la cookie de este navegador para recuperar tu partida. Puedes jugar con teclado, ratón o controles táctiles. El contenido largo se reparte en páginas, sin desplazamiento vertical.";

export function GameScreen() {
  const state = useGame();
  const { catalog, current, create, action, pending } = state;
  const game = current.data;
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const requested = params.get("pantalla");
  const screen = isScreen(requested) ? requested : "home";
  const previous = location.state?.previous as Screen | undefined;
  const restartConfirmed = location.state?.restartGameId === game?.id;
  const sourceId = params.get("fuente");
  const routesMap = game?.phase === "travel" && params.get("modo") !== "origen";
  const sourceScene =
    game?.scenes.find((scene) => scene.id === sourceId) ??
    game?.journal
      .flatMap((city) => city.scenes)
      .find((scene) => scene.id === sourceId);
  const [mapSelection, setMapSelection] = useState<string | null>(null);
  const [readingSceneId, setReadingSceneId] = useState<string | null>(null);
  const [journalIndex, setJournalIndex] = useState(0);
  const [earnedStamp, setEarnedStamp] = useState<{
    gameId: string;
    cityId: string;
  } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const needsGame = ["adventure", "journal", "feedback", "stamp"].includes(
    screen,
  );
  const view =
    screen === "home" ||
    (!game && needsGame) ||
    (screen === "sources" && !sourceScene) ||
    (screen === "feedback" && !game?.feedback) ||
    (screen === "stamp" && (!earnedStamp || earnedStamp.gameId !== game?.id))
      ? game
        ? "adventure"
        : "welcome"
      : screen;
  const error = catalog.error ?? current.error ?? create.error ?? action.error;
  function setScreen(next: Screen) {
    void navigate(screenUrl(next), { replace: true });
  }
  function screenLink(next: Screen, sceneId?: string) {
    return {
      to: screenUrl(next, sceneId, next === "map" && view === "destinations"),
      state: { previous: view },
    };
  }
  function open(next: Screen) {
    if (next === view) return;
    const { to, state } = screenLink(next);
    void navigate(to, { state });
  }
  function back() {
    if (previous) void navigate(-1);
    else if (screen !== "home") setScreen("home");
  }
  function sourcesLink(sceneId: string) {
    return screenLink("sources", sceneId);
  }
  function newJourney() {
    setMapSelection(null);
    create.reset();
    action.reset();
    const { to, state } = screenLink("destinations");
    void navigate(to, {
      replace: view === "destinations",
      state: {
        ...(view === "destinations" ? location.state : state),
        restartGameId: game?.id,
      },
    });
  }
  function choose(initialCityId: string) {
    create.mutate(
      {
        initialCityId,
        expectedGameId: game?.id ?? null,
        requestId: crypto.randomUUID(),
      },
      {
        onSuccess: () => {
          setMapSelection(null);
          setReadingSceneId(null);
          setJournalIndex(0);
          setEarnedStamp(null);
          setScreen("home");
        },
      },
    );
  }
  function decide(
    decision: GameAction,
    onSuccess?: Parameters<typeof state.decide>[1],
  ) {
    state.decide(decision, (updated) => {
      onSuccess?.(updated);
      if (decision.type === "chooseRoute") {
        setMapSelection(null);
        setReadingSceneId(null);
      }
      if (decision.type === "answerQuestion") {
        const newStamp = updated.stamps.find(
          (cityId) => !game?.stamps.includes(cityId),
        );
        setEarnedStamp(
          newStamp ? { gameId: updated.id, cityId: newStamp } : null,
        );
        setScreen("feedback");
      }
    });
  }
  useKeyboardNavigation({
    root,
    screenKey: `${view}-${game?.phase}-${game?.currentCityId}-${game?.question?.id}-${!!error}`,
    onBack: back,
    onHelp: () => (view === "help" ? back() : open("help")),
    onJournal: () => {
      if (game) {
        if (view === "journal") back();
        else open("journal");
      }
    },
  });
  const ready = catalog.data && current.isSuccess;
  let content;
  if (error)
    content = (
      <section className="screen">
        <div className="screen-heading">
          <h1 data-screen-title tabIndex={-1}>
            No se pudo completar la decisión
          </h1>
        </div>
        <PagedReader
          text={`${error.message}\n\nRecupera tu progreso para volver a intentarlo.`}
          label="Error de conexión"
        />
        <div className="screen-actions">
          <Button
            data-primary
            onClick={() => {
              create.reset();
              action.reset();
              void catalog.refetch();
              void current.refetch();
            }}
          >
            Recuperar progreso
          </Button>
        </div>
      </section>
    );
  else if (!ready)
    content = (
      <section className="screen loading-state" role="status">
        <Compass aria-hidden="true" size={40} />
        <p>Desplegando el atlas…</p>
      </section>
    );
  else if (view === "welcome")
    content = (
      <section className="screen welcome-screen">
        <div className="welcome-copy">
          <h1 data-screen-title tabIndex={-1}>
            Seis ciudades. Tres sellos.
          </h1>
          <p>
            Elige tu punto de partida y recorre tres ciudades. Explora sus
            monumentos y responde preguntas para sellar tu pasaporte.
          </p>
        </div>
        <AtlanticChart cities={catalog.data.cities} />
        <div className="screen-actions">
          {game && (
            <Button asChild variant="tonal">
              <Link to={screenUrl("home")} replace>
                Reanudar viaje
              </Link>
            </Button>
          )}
          <Button asChild data-primary data-screen-next>
            <Link
              {...screenLink("destinations")}
              onClick={(event) => {
                if (
                  event.button === 0 &&
                  !event.altKey &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.shiftKey
                )
                  setMapSelection(null);
              }}
            >
              Elegir mi origen →
            </Link>
          </Button>
        </div>
      </section>
    );
  else if (view === "help")
    content = (
      <section className="screen">
        <div className="screen-heading">
          <h1 data-screen-title tabIndex={-1}>
            Controles y reglas
          </h1>
        </div>
        <PagedReader text={helpText} label="Ayuda" />
        <div className="screen-actions">
          <Button data-primary onClick={back}>
            Volver al juego
          </Button>
        </div>
      </section>
    );
  else if (view === "journal" && game)
    content = (
      <Journal
        game={game}
        index={journalIndex}
        onIndexChange={setJournalIndex}
        onBack={back}
        sourcesLink={sourcesLink}
      />
    );
  else if (view === "sources" && sourceScene)
    content = <Sources scene={sourceScene} onBack={back} />;
  else if (view === "map")
    content = (
      <section className="screen map-screen">
        <div className="screen-heading">
          <h1 data-screen-title tabIndex={-1}>
            Atlas de destinos
          </h1>
        </div>
        <AtlasMap
          cities={routesMap ? game.cities : catalog.data.cities}
          selectedId={mapSelection}
          onSelect={setMapSelection}
          disabled={pending}
          region={params.get("region")}
          onRegionChange={(region) => {
            if (region === "atlantic") params.delete("region");
            else params.set("region", region);
            void navigate(
              { search: params.toString() },
              { replace: true, state: location.state },
            );
          }}
        />
        <div className="screen-actions">
          <Button
            data-primary
            onClick={
              previous
                ? back
                : () => setScreen(routesMap ? "home" : "destinations")
            }
          >
            Volver a destinos
          </Button>
          <span className="map-selection" role="status">
            {mapSelection
              ? catalog.data.cities.find((city) => city.id === mapSelection)
                  ?.name
              : "Explora el mapa; confirma el viaje en destinos."}
          </span>
        </div>
      </section>
    );
  else if (
    view === "destinations" ||
    (view === "adventure" && game?.phase === "travel")
  )
    content = (
      <DestinationPicker
        key={`${view}-${game?.currentCityId}`}
        cities={view === "destinations" ? catalog.data.cities : game!.cities}
        selectedId={mapSelection}
        onSelect={setMapSelection}
        pending={pending}
        requireConfirmation={
          view === "destinations" && !!game && !restartConfirmed
        }
        travel={view !== "destinations"}
        onChoose={(id) =>
          view === "destinations"
            ? choose(id)
            : decide({ type: "chooseRoute", cityId: id })
        }
        mapLink={screenLink("map")}
        onBack={view === "destinations" ? back : () => open("journal")}
      />
    );
  else if (view === "stamp" && game && earnedStamp?.gameId === game.id)
    content = (
      <PassportStamp
        key={`${earnedStamp.gameId}-${earnedStamp.cityId}`}
        game={game}
        cityId={earnedStamp.cityId}
        onContinue={() => {
          setEarnedStamp(null);
          setScreen("home");
        }}
      />
    );
  else if (view === "feedback" && game?.feedback)
    content = (
      <section className="screen feedback-screen">
        <div className="screen-heading">
          <h1 data-screen-title tabIndex={-1}>
            {game.feedback.correct
              ? "¡Respuesta correcta!"
              : "Respuesta incorrecta."}
          </h1>
        </div>
        <PagedReader
          label="Explicación de la respuesta"
          text={game.feedback.explanation}
        />
        <div className="screen-actions">
          <Button asChild variant="outline">
            <Link {...screenLink("journal")}>Repasar cuaderno</Link>
          </Button>
          <Button
            data-primary
            data-screen-next
            onClick={() =>
              setScreen(earnedStamp?.gameId === game.id ? "stamp" : "home")
            }
          >
            {earnedStamp?.gameId === game.id
              ? "Ver sello →"
              : "Seguir el viaje →"}
          </Button>
        </div>
      </section>
    );
  else if (game)
    content = (
      <Adventure
        key={`${game.id}-${game.currentCityId}-${game.phase}`}
        game={game}
        readingSceneId={readingSceneId}
        onSceneChange={setReadingSceneId}
        pending={pending}
        decide={decide}
        sourcesLink={sourcesLink}
        onRestart={newJourney}
        journalLink={screenLink("journal")}
      />
    );
  return (
    <div className="app-shell" ref={root}>
      <Button asChild className="skip-link">
        <a href="#main">Saltar al contenido</a>
      </Button>
      <header className="site-header">
        <Link
          replace={view === "welcome"}
          className="wordmark"
          to={screenUrl("welcome")}
          state={view === "welcome" ? location.state : { previous: view }}
          aria-label="Ir al inicio"
        >
          <Compass aria-hidden="true" size={25} />
          <span translate="no">Pasaporte Infinito</span>
        </Link>
        <nav aria-label="Menú del juego">
          <Button
            variant="ghost"
            size="small"
            onClick={() => (view === "help" ? back() : open("help"))}
          >
            Ayuda <kbd>H</kbd>
          </Button>
          {game && (
            <>
              <Button
                variant="ghost"
                size="small"
                onClick={() => (view === "journal" ? back() : open("journal"))}
                aria-label="Abrir cuaderno de viaje"
              >
                Cuaderno <kbd>J</kbd>
              </Button>
              <ConfirmDialog disabled={pending} onConfirm={newJourney} />
            </>
          )}
        </nav>
      </header>
      {game && view !== "welcome" && (
        <div className="game-hud" aria-label="Estado del viaje">
          <span>{game.journal.map((city) => city.name).join(" → ")}</span>
          <span>
            {game.stamps.length}/3 sellos · {game.cityErrors}/3 errores
          </span>
          <span role="status">
            {pending ? "Guardando…" : error ? "Sin confirmar" : "Guardado"}
          </span>
        </div>
      )}
      <span className="sr-only" role="status">
        {pending ? "Guardando progreso…" : ""}
      </span>
      <main id="main" tabIndex={-1} aria-busy={pending}>
        {content}
      </main>
      <footer className="site-footer">
        <KeyboardGuide />
      </footer>
    </div>
  );
}
