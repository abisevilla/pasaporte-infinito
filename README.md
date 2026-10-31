# Pasaporte Infinito

Aventura cultural individual en español con seis destinos reales: Madrid, Barcelona,
París, Roma, Nueva York y Washington D. C. Elige libremente tu origen, explora tres escenas
y responde tres preguntas por ciudad. Tres errores en un destino terminan la partida;
al viajar el contador se reinicia. Tres sellos completan el itinerario y generan su epílogo.

El juego incluye 18 escenas y 18 preguntas documentadas, 120 itinerarios, mapa con zoom y
vistas regionales, selección por lista, cuaderno y recuperación del progreso mediante una
cookie anónima HttpOnly. No necesita cuentas ni servicios de generación de contenido.

## Pantallas y teclado

La interfaz es una SPA organizada en pantallas que ocupan la ventana, sin desplazamiento
vertical. Inicio, destinos, mapa, escenas, preguntas, resultados, cuaderno, fuentes y ayuda
se muestran por separado. El texto se divide en páginas según el espacio disponible y se
recalcula al cambiar el tamaño de la ventana. Las flechas permiten recorrerlo sin ocultar
el resto del contenido.

Los controles aparecen desde el inicio y permanecen disponibles en el pie de pantalla:

| Tecla | Acción |
| --- | --- |
| `↑` / `↓` | Elegir ciudad o respuesta; recorrer controles cuando no hay opciones |
| `←` / `→` | Cambiar de página de texto, escena o entrada; en destinos, cambiar de ciudad |
| `Enter` | Confirmar una elección o activar el botón enfocado |
| `Espacio` | Activar un botón o marcar una respuesta |
| `Tab` / `Mayús + Tab` | Recorrer todos los controles, incluidos menús y enlaces |
| `Escape` / `Retroceso` | Volver a la pantalla anterior; Escape cierra los diálogos |
| `H` / `?` | Abrir o cerrar la ayuda |
| `J` | Abrir o cerrar el cuaderno durante una partida |
| `Inicio` / `Fin` | Primera o última opción |
| `Re Pág` / `Av Pág` | Página de texto anterior o siguiente |

Cambiar de escena con las flechas solo permite leerla. `Registrar escena` guarda su
exploración en el backend. Las respuestas requieren confirmación; mantener Enter pulsado
no envía acciones sucesivas. Tras cada respuesta hay una pantalla de explicación antes
de continuar. El ratón y los controles táctiles siguen disponibles.

## Ejecutar en local

Requisitos comprobados: Python **3.15.2**, Node **24** y npm. Desde la raíz:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m pip check
```

En una terminal, desde `backend/`:

```sh
../.venv/bin/alembic upgrade head
PUBLIC_ORIGIN=http://127.0.0.1:5173 ../.venv/bin/python -m uvicorn app.main:app --reload
```

En otra terminal, desde `frontend/`:

```sh
npm ci
npm run dev
```

Abre **http://127.0.0.1:5173**. Vite reenvía `/api` a la API en el puerto 8000.
La documentación HTTP está en **http://127.0.0.1:8000/docs**.
SQLite se guarda en `backend/data/pasaporte.sqlite3`. Las migraciones crean el esquema;
la aplicación valida el catálogo durante el arranque. El backend es la única autoridad
sobre respuestas, errores, rutas y versiones del estado.

## Configuración

La aplicación utiliza variables del proceso; no carga archivos `.env` automáticamente.
`.env.example` documenta valores locales sin secretos.

| Variable | Valor por defecto / uso |
| --- | --- |
| `DATABASE_URL` | `sqlite:///./data/pasaporte.sqlite3`, relativo al directorio de ejecución |
| `PUBLIC_ORIGIN` | Origen de la API; para un proxy con otro origen, indicar el origen público |
| `COOKIE_SECURE` | `false` en local; usar `true` al servir mediante HTTPS |
| `STATIC_DIR` | `frontend/dist` del repositorio |

El progreso está en el servidor; la cookie identifica tu partida durante 180 días.
Si borras la cookie o cambias de navegador no podrás recuperar esa identidad anónima.
No se ofrece modo sin conexión. Un conflicto entre pestañas recupera el estado vigente;
los reintentos de red de una misma solicitud conservan su UUID para no repetir efectos.

## Compilación y entrega local

Desde `frontend/`:

```sh
npm run build
```

Para servir la compilación desde FastAPI, inicia desde `backend/` sin la variable de origen de Vite:

```sh
../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Abre **http://127.0.0.1:8000**. El frontend y la API comparten entonces el mismo origen.

Se incluye un contenedor con un volumen persistente:

```sh
docker compose up --build
```

Abre **http://127.0.0.1:8000**. El contenedor aplica las migraciones y se ejecuta con un
usuario sin privilegios. `game-data` conserva SQLite al recrear el servicio. No elimines
ese volumen si quieres conservar las partidas. Docker requiere una comprobación en un
entorno que lo tenga instalado; no se ha ejecutado aquí. No se ha publicado externamente.

## Verificación

Desde `backend/`:

```sh
../.venv/bin/python -m pytest
../.venv/bin/ruff check .
../.venv/bin/ruff format --check .
```

Desde `frontend/`:

```sh
npm test
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Playwright comprueba los seis orígenes, recuperación, tres sellos, epílogo, cuaderno y
reinicio tras derrota, en escritorio y móvil. Cuando inicia su propia API utiliza
`backend/data/e2e.sqlite3`. No ejecutes las pruebas contra un servidor con partidas importantes:
para aislarlas, detén tus servidores locales y deja que Playwright inicie los suyos.

La integración continua en `.github/workflows/verify.yml` ejecuta estas comprobaciones
con Python 3.15 y Node 24. Su resultado remoto queda pendiente de ejecutar en GitHub.

## Contratos y dependencias

Después de modificar los contratos HTTP, desde `backend/`:

```sh
../.venv/bin/python -m scripts.export_openapi
```

Después, desde `frontend/`, ejecuta `npm run api:types` y versiona ambos archivos generados.
No edites manualmente `src/shared/api-schema.ts`.

`backend/requirements.in` contiene los rangos; `backend/requirements.txt` fija el entorno
instalado en macOS Apple Silicon. La compatibilidad con Linux se comprobará en CI y Docker.
Los overrides npm fijan versiones corregidas de minimatch y undici en las herramientas de
lint/generación; se verifican con lint, generación de tipos y build. No se usa `audit fix --force`.

## Contenido y recursos

El catálogo versionado está en `backend/app/data/content/v1.json`. Cada escena y pregunta
incluye fuentes oficiales y fecha de revisión; los textos son redacciones originales en
español. Las respuestas correctas permanecen en el backend y no se envían al cliente.
Las ilustraciones de monumentos son SVG originales; la cartografía Natural Earth es de
dominio público y se incluye localmente. Consulta `frontend/src/assets/LICENSE.md`.

El objetivo de 20–30 minutos y la dificultad siguen pendientes de validación con jugadores.
Las verificaciones automáticas no sustituyen una evaluación completa con lectores de pantalla.
