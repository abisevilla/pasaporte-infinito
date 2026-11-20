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
  "↑ / ↓: elegir una ciudad o respuesta. Úsalas desde el encabezado o las opciones.\n\n← / →: cambiar de escena o entrada del cuaderno. Con el foco en la paginación, cambian de página. En destinos cambian la ciudad seleccionada. Navegar por una escena no la registra.\n\nEnter: confirmar la opción elegida o activar el botón enfocado. Espacio: activar un botón o marcar una respuesta. Tab / Mayús + Tab: recorrer todos los controles.\n\nEscape o Retroceso: volver. Si activas los atajos de carácter, H o ? abre esta ayuda y J abre o cierra el cuaderno. Inicio / Fin: primera o última opción. Re Pág / Av Pág: cambiar de página de texto.\n\nTres escenas y tres preguntas por ciudad. Debes registrar las tres escenas para abrir el desafío. El tercer error en una ciudad termina la aventura; el contador se reinicia al viajar. Tres sellos completan tu itinerario.\n\nEl progreso se guarda en el servidor. Conserva la cookie de este navegador para recuperar tu partida. Puedes jugar con teclado, ratón o controles táctiles. El contenido largo se reparte en páginas. En ventanas muy reducidas también puedes desplazar la pantalla.";

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
  const earnedStamp =
    game?.feedback?.correct && game.stamps.includes(game.currentCityId)
      ? game.currentCityId
      : null;
  const root = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<string | null>(null);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(() => {
    try {
      return localStorage.getItem("atajos-de-caracter") !== "desactivados";
    } catch {
      return true;
    }
  });
  function changeShortcuts(enabled: boolean) {
    setShortcutsEnabled(enabled);
    try {
      localStorage.setItem(
        "atajos-de-caracter",
        enabled ? "activados" : "desactivados",
      );
    } catch {
      // La preferencia sigue disponible durante la sesión actual.
    }
  }
  const needsGame = ["adventure", "journal", "feedback", "stamp"].includes(
    screen,
  );
  const view =
    screen === "home" ||
    (!game && needsGame) ||
    (screen === "sources" && !sourceScene) ||
    (screen === "feedback" && !game?.feedback) ||
    (screen === "stamp" && !earnedStamp)
      ? game
        ? "adventure"
        : "welcome"
      : screen;
  const failedRequest = action.variables?.request;
  const failedAnswer =
    failedRequest?.action.type === "answerQuestion" &&
    failedRequest.gameId === game?.id &&
    failedRequest.action.questionId === game?.question?.id
      ? failedRequest.action
      : null;
  const answerError = failedAnswer ? action.error : null;
  const answerConflict = !!answerError && state.actionConflict;
  const error =
    catalog.error ??
    current.error ??
    create.error ??
    (failedRequest?.action.type === "answerQuestion" ? null : action.error);
  const ready = !!catalog.data && current.isSuccess;
  function setScreen(next: Screen) {
    void navigate(screenUrl(next), { replace: true });
  }
  function screenLink(next: Screen, sceneId?: string, focusId?: string) {
    return {
      to: screenUrl(next, sceneId, next === "map" && view === "destinations"),
      state: { previous: view, focusId },
    };
  }
  function open(next: Screen, focusId?: string) {
    if (next === view) return;
    const { to, state } = screenLink(next, undefined, focusId);
    void navigate(to, { state });
  }
  function back() {
    if (previous) {
      returnFocusRef.current = location.state?.focusId ?? null;
      void navigate(-1);
    } else if (screen !== "home") setScreen("home");
  }
  function sourcesLink(sceneId: string) {
    return screenLink("sources", sceneId, "scene-sources");
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
      if (decision.type === "answerQuestion")
        showAnswerFeedback(updated, decision.questionId);
    });
  }
  function showAnswerFeedback(
    updated: NonNullable<typeof game>,
    questionId: string,
  ) {
    setScreen(
      updated.feedback?.questionId === questionId ? "feedback" : "home",
    );
  }
  useKeyboardNavigation({
    root,
    returnFocusRef,
    shortcutsEnabled,
    screenKey: `${view}-${game?.phase}-${game?.currentCityId}-${game?.question?.id}-${!!error}-${ready}`,
    onBack: back,
    onHelp: () => (view === "help" ? back() : open("help", "help-trigger")),
    onJournal: () => {
      if (game) {
        if (view === "journal") back();
        else open("journal", "journal-trigger");
      }
    },
  });
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
  else if (!catalog.data || !ready)
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
        <label className="shortcut-preference">
          <input
            type="checkbox"
            checked={shortcutsEnabled}
            onChange={(event) => changeShortcuts(event.target.checked)}
          />
          Activar atajos H, J y ?
        </label>
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
        onBack={
          view === "destinations"
            ? back
            : () => open("journal", "journal-trigger")
        }
      />
    );
  else if (view === "stamp" && game && earnedStamp)
    content = (
      <PassportStamp
        key={`${game.id}-${earnedStamp}`}
        game={game}
        cityId={earnedStamp}
        onContinue={() => setScreen("home")}
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
            <Link
              id="review-journal"
              {...screenLink("journal", undefined, "review-journal")}
            >
              Repasar cuaderno
            </Link>
          </Button>
          <Button
            data-primary
            data-screen-next
            onClick={() => setScreen(earnedStamp ? "stamp" : "home")}
          >
            {earnedStamp ? "Ver sello →" : "Seguir el viaje →"}
          </Button>
        </div>
      </section>
    );
  else if (game)
    content = (
      <Adventure
        key={`${game.id}-${game.currentCityId}-${game.phase}-${game.question?.id ?? ""}`}
        game={game}
        readingSceneId={readingSceneId}
        onSceneChange={setReadingSceneId}
        pending={pending}
        decide={decide}
        sourcesLink={sourcesLink}
        onRestart={newJourney}
        journalLink={screenLink("journal", undefined, "review-journal")}
        answerError={answerError?.message}
        failedOptionId={answerError ? failedAnswer?.optionId : undefined}
        retryLabel={answerConflict ? "Recuperar progreso" : "Reintentar"}
        onRetryAnswer={async () => {
          if (answerConflict) {
            const result = await current.refetch();
            if (result.isSuccess) action.reset();
          } else if (failedAnswer) {
            state.retryAnswer((updated) =>
              showAnswerFeedback(updated, failedAnswer.questionId),
            );
          }
        }}
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
            id="help-trigger"
            onClick={() =>
              view === "help" ? back() : open("help", "help-trigger")
            }
          >
            Ayuda {shortcutsEnabled && <kbd>H</kbd>}
          </Button>
          {game && (
            <>
              <Button
                variant="ghost"
                size="small"
                id="journal-trigger"
                onClick={() =>
                  view === "journal"
                    ? back()
                    : open("journal", "journal-trigger")
                }
                aria-label="Abrir cuaderno de viaje"
              >
                Cuaderno {shortcutsEnabled && <kbd>J</kbd>}
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
            {pending
              ? "Guardando…"
              : error || answerError
                ? "Sin confirmar"
                : "Guardado"}
          </span>
        </div>
      )}
      {(!game || view === "welcome") && (
        <span className="sr-only" role="status">
          {pending ? "Guardando progreso…" : ""}
        </span>
      )}
      <main id="main" tabIndex={-1} aria-busy={pending}>
        {content}
      </main>
      <footer className="site-footer">
        <KeyboardGuide shortcutsEnabled={shortcutsEnabled} />
      </footer>
    </div>
  );
}
