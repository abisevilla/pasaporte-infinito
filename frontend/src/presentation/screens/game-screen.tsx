import { useRef, useState } from "react";
import { Compass } from "lucide-react";
import { useGame } from "@/business/game/use-game";
import type { GameAction, Scene } from "@/shared/types";
import { useKeyboardNavigation } from "../hooks/use-keyboard-navigation";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { AtlasMap } from "../components/game/atlas-map";
import { Adventure } from "../components/game/adventure";
import { DestinationPicker } from "../components/game/destination-picker";
import { Journal, Sources } from "../components/game/journal";
import { PagedReader } from "../components/game/paged-reader";
import { KeyboardGuide } from "../components/game/keyboard-guide";

type Screen =
  | "home"
  | "welcome"
  | "destinations"
  | "help"
  | "journal"
  | "sources"
  | "map"
  | "feedback"
  | "adventure";
const helpText =
  "↑ / ↓: elegir una ciudad o respuesta. Si no hay opciones, mover el foco entre los controles.\n\n← / →: cambiar de escena, entrada del cuaderno o página de texto. En destinos cambian la ciudad seleccionada. Navegar por una escena no la registra.\n\nEnter: confirmar la opción elegida o activar el botón enfocado. Espacio: activar un botón o marcar una respuesta. Tab / Mayús + Tab: recorrer todos los controles.\n\nEscape o Retroceso: volver. H o ?: abrir esta ayuda. J: abrir o cerrar el cuaderno. Inicio / Fin: primera o última opción. Re Pág / Av Pág: cambiar de página de texto.\n\nTres escenas y tres preguntas por ciudad. Debes registrar las tres escenas para abrir el desafío. El tercer error en una ciudad termina la aventura; el contador se reinicia al viajar. Tres sellos completan tu itinerario.\n\nEl progreso se guarda en el servidor. Conserva la cookie de este navegador para recuperar tu partida. Puedes jugar con teclado, ratón o controles táctiles. El contenido largo se reparte en páginas, sin desplazamiento vertical.";

export function GameScreen() {
  const state = useGame();
  const { catalog, current, create, action, pending } = state;
  const game = current.data;
  const [screen, setScreen] = useState<Screen>("home");
  const [history, setHistory] = useState<Screen[]>([]);
  const [sourceScene, setSourceScene] = useState<Scene | null>(null);
  const [mapSelection, setMapSelection] = useState<string | null>(null);
  const [readingSceneId, setReadingSceneId] = useState<string | null>(null);
  const [journalIndex, setJournalIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const view = screen === "home" ? (game ? "adventure" : "welcome") : screen;
  const error = catalog.error ?? current.error ?? create.error ?? action.error;
  function open(next: Screen) {
    if (next === view) return;
    if (next === "destinations") setMapSelection(null);
    setHistory((previous) => [...previous, view]);
    setScreen(next);
  }
  function back() {
    const previous = history.at(-1);
    setHistory((items) => items.slice(0, -1));
    setScreen(previous ?? "home");
  }
  function openSources(scene: Scene) {
    setSourceScene(scene);
    open("sources");
  }
  function newJourney() {
    setMapSelection(null);
    create.reset();
    action.reset();
    setHistory(["home"]);
    setScreen("destinations");
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
          setHistory([]);
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
        setScreen("feedback");
        setHistory([]);
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
        <PagedReader text={error.message} label="Error de conexión" />
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
        <Compass size={40} />
        <p>Desplegando el atlas…</p>
      </section>
    );
  else if (view === "welcome")
    content = (
      <section className="screen welcome-screen">
        <div className="screen-heading">
          <p className="eyebrow">Una aventura cultural · A tu ritmo</p>
          <h1 data-screen-title tabIndex={-1}>
            Seis ciudades. Tres sellos.
            <br />
            <em>Tu propio camino.</em>
          </h1>
        </div>
        <div className="welcome-body">
          <div className="passport-emblem" aria-hidden="true">
            <Compass size={70} />
            <span>
              PASAPORTE
              <br />
              INFINITO
            </span>
          </div>
          <div className="welcome-instructions">
            <p>
              Elige tu origen, explora tres ciudades y reúne los sellos de tu
              viaje.
            </p>
            <p>
              <kbd>↑</kbd> <kbd>↓</kbd> elegir · <kbd>←</kbd> <kbd>→</kbd>{" "}
              avanzar o volver
            </p>
            <p>
              <kbd>Enter</kbd> confirmar · <kbd>Esc</kbd> volver
            </p>
            <p>
              <kbd>H</kbd> ayuda · <kbd>J</kbd> cuaderno · <kbd>Tab</kbd>{" "}
              recorrer controles
            </p>
          </div>
        </div>
        <div className="screen-actions">
          <Button variant="outline" onClick={() => open("help")}>
            Controles y reglas
          </Button>
          {game && (
            <Button variant="outline" onClick={() => setScreen("home")}>
              Continuar mi partida
            </Button>
          )}
          <Button
            data-primary
            data-screen-next
            onClick={() => open("destinations")}
          >
            Elegir mi origen →
          </Button>
        </div>
      </section>
    );
  else if (view === "help")
    content = (
      <section className="screen">
        <div className="screen-heading">
          <p className="eyebrow">Teclado, ratón o pantalla táctil</p>
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
        onSources={openSources}
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
          cities={
            game?.phase === "travel" && history.at(-1) !== "destinations"
              ? game.cities
              : catalog.data.cities
          }
          selectedId={mapSelection}
          onSelect={setMapSelection}
          disabled={pending}
        />
        <div className="screen-actions">
          <Button data-primary onClick={back}>
            Volver a destinos
          </Button>
          <span className="map-selection">
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
        travel={view !== "destinations"}
        onChoose={(id) =>
          view === "destinations"
            ? choose(id)
            : decide({ type: "chooseRoute", cityId: id })
        }
        onMap={() => open("map")}
        onBack={view === "destinations" ? back : () => open("journal")}
      />
    );
  else if (view === "feedback" && game?.feedback)
    content = (
      <section className="screen feedback-screen">
        <div className="screen-heading">
          <p className="eyebrow">
            {game.feedback.correct
              ? "Un detalle más en tu cuaderno"
              : `Errores en esta ciudad: ${game.cityErrors} / 3`}
          </p>
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
          <Button variant="outline" onClick={() => open("journal")}>
            Repasar cuaderno
          </Button>
          <Button
            data-primary
            data-screen-next
            onClick={() => setScreen("home")}
          >
            Continuar →
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
        onSources={openSources}
        onRestart={newJourney}
        onJournal={() => open("journal")}
      />
    );
  return (
    <div className="app-shell" ref={root}>
      <header className="site-header">
        <button
          className="wordmark"
          onClick={() => open("welcome")}
          aria-label="Ir al inicio"
        >
          <Compass size={25} />
          <span>PASAPORTE INFINITO</span>
        </button>
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
      <main id="main" aria-busy={pending}>
        {content}
      </main>
      <footer className="site-footer">
        <KeyboardGuide />
      </footer>
    </div>
  );
}
