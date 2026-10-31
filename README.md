# Pasaporte Infinito

Aventura cultural individual en español con React y FastAPI. Proyecto en implementación:
el entorno del backend está preparado, pero todavía faltan el catálogo cultural y la interfaz.

## Entorno local

Python verificado: **3.15.2**. Ejecuta desde la raíz:

```sh
python3 --version
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m pip check
```

`backend/requirements.in` declara los rangos de dependencias; `backend/requirements.txt`
fija las versiones instaladas. La instalación se ha comprobado en macOS con Apple Silicon.

Desde `backend/`, prepara SQLite y ejecuta las comprobaciones:

```sh
../.venv/bin/alembic upgrade head
../.venv/bin/python -m pytest
../.venv/bin/ruff check .
../.venv/bin/ruff format --check .
```

SQLite se guarda en `backend/data/pasaporte.sqlite3` y queda excluido de Git.
Las migraciones crean el esquema; la aplicación no lo crea automáticamente.

Cuando exista `backend/app/data/content/v1.json`, se podrá iniciar la API desde `backend/`:

```sh
../.venv/bin/python -m uvicorn app.main:app --reload
```

El arranque completo valida el catálogo cultural. Mientras falte ese archivo, el servidor
no puede completar el inicio. La documentación de la API estará en `/docs`.

## Frontend

Desde `frontend/`:

```sh
npm ci
npm run dev
```

El manifiesto ya está preparado; `src/` sigue pendiente de implementación.
Los comandos configurados incluyen `npm test`, `npm run lint`, `npm run format:check`
y `npm run build`. Todavía no se ha verificado una aplicación frontend ejecutable.

## Configuración

El backend utiliza variables del proceso y no carga archivos `.env` automáticamente:

- `DATABASE_URL`: por defecto `sqlite:///./data/pasaporte.sqlite3`, relativo al directorio de ejecución.
- `PUBLIC_ORIGIN`: origen permitido para solicitudes que modifican la partida; por defecto el origen de la API.
- `COOKIE_SECURE`: `true` para cookies HTTPS; por defecto `false` durante desarrollo local.
- `STATIC_DIR`: directorio de la compilación frontend, cuando esté disponible.

No se necesitan claves externas para el juego. No publiques archivos de entorno ni bases de datos.

El contrato aprobado y los próximos pasos están en [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
