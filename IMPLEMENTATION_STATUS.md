# Punto de reanudación — Pasaporte Infinito

## Reanudación — entorno verificado

El usuario solicitó continuar el 30 de octubre de 2026. Se comprobó Python 3.15.2
en el sistema y en `.venv/`; se instalaron las dependencias de `backend/requirements.in`
y se fijaron las versiones en `backend/requirements.txt`. `pip check` no encontró conflictos.
`.python-version` ahora coincide con la instalación disponible. Ruff conserva `py312`
como objetivo de sintaxis mínima; no selecciona el intérprete del entorno virtual.

Verificación realizada: importaciones de FastAPI/Pydantic/SQLAlchemy, respuesta del endpoint
de salud sin ejecutar el ciclo de inicio completo, migración local hasta `001 (head)`,
prueba automatizada de migración repetible y configuración SQLite, lint y formato del backend.
La prueba automatizada usa una base temporal; no hay pruebas de reglas o API completas todavía.
Se añadió README con los comandos reales. No se hizo commit ni push.

Se corrigió `.gitignore`: solamente `/data/` y `/backend/data/` se excluyen;
`backend/app/data/` ahora es visible para Git. La API completa sigue pendiente del catálogo.

**Siguiente paso:** redactar y verificar el catálogo cultural de las seis ciudades, seguido
de las pruebas de reglas y persistencia descritas en el plan. Continúan pendientes la interfaz,
la auditoría npm, las pruebas integrales y la entrega final.

## Antecedentes de la pausa (histórico)

El usuario instaló Python en el sistema y va a reiniciar la laptop. Solicitó pausar y retomar la implementación desde el paso de instalación/configuración de Python. No continuar hasta que indique que desea seguir.

La implementación completa del plan está autorizada. La publicación externa queda fuera de esta entrega.

## Primer paso al retomar

1. Comprobar el Python disponible después del reinicio y la versión del entorno virtual existente.
2. Preparar el entorno de backend y sus dependencias usando la instalación disponible. No volver a solicitar descargar Python sin comprobar primero la instalación del usuario.
3. Continuar la implementación desde los archivos existentes; no reiniciar el proyecto ni sobrescribir cambios del usuario.

Antes de la pausa se detectó Python **3.15.2** en `/Library/Frameworks/Python.framework/Versions/3.15/bin/python3`. Se creó `.venv/` con ese intérprete y `.venv/bin/python --version` confirmó 3.15.2. Todavía no se instalaron las dependencias del backend. El plan y `.python-version` indican 3.12: verificar compatibilidad y resolver esta diferencia al retomar.

La descarga de Python 3.12 con uv falló dentro del sandbox; la solicitud posterior para descargarlo con permisos ampliados fue rechazada. No repetir esa descarga automáticamente.

## Estado del repositorio

- Rama: `feature/epic-1-juego-completo`, creada desde `main`.
- Último commit existente: `c3b4c5c create agents.md`.
- Los archivos de implementación están sin commit. No se hizo push ni se creó un PR.
- Node disponible antes del reinicio: 24.22.1.
- Frontend: `npm install` terminó y creó `package-lock.json`; dependencias presentes en `frontend/node_modules/`.
- El instalador informó 17 vulnerabilidades (15 moderadas y 2 críticas): inspeccionar `npm audit` y corregir las dependencias afectadas antes de entregar, sin aplicar cambios forzados a ciegas.
- La instalación inicial de npm dentro del sandbox se interrumpió; la instalación con acceso de red terminó correctamente. No hay servidor de desarrollo iniciado.
- `.bootstrap/` contiene un entorno temporal Python 3.9 con uv 0.13.6. No es el entorno final del backend.

## Archivos ya escritos

- `.gitignore` y `.python-version`.
- Frontend: manifiesto, lockfile, HTML de entrada, TypeScript, Vite/Vitest, ESLint, Prettier y configuración de shadcn/ui.
- Backend: requisitos de entrada, configuración pytest/Ruff, motor puro, validador de contenido, repositorio SQLAlchemy, modelos de base de datos, contratos Pydantic y aplicación FastAPI.
- Alembic: configuración, entorno y migración inicial para identidades anónimas, partidas y recibos de acciones.
- Script para exportar OpenAPI.

**Corrección importante pendiente:** `.gitignore` contiene `data/`, que también oculta el código de `backend/app/data/` a Git y a `rg`. Limitar esa exclusión a los directorios de datos de ejecución; conservar y versionar `backend/app/data/content.py`, `repository.py` y el contenido cultural.

## Contrato del juego aprobado

- Aventura cultural individual en español; seis ciudades: Madrid, Barcelona, París, Roma, Nueva York y Washington D. C.
- El jugador elige cualquiera de las seis ciudades iniciales; ninguna está preseleccionada.
- Tres ciudades distintas por partida, sin obligación de combinar continentes: 120 itinerarios ordenados.
- Cada ciudad: tres escenas y un desafío de tres preguntas de conocimientos, con cuatro opciones y una respuesta correcta.
- Tres errores por ciudad; el tercer error termina la aventura. El contador se reinicia al cambiar de ciudad.
- Superar el desafío concede un sello y permite elegir cualquier ciudad no visitada. El tercer destino descarta las restantes.
- Tres sellos completan la partida y abren un epílogo generado desde el itinerario.
- Reiniciar tras perder vuelve a la elección libre de ciudad inicial.
- Contenido basado exclusivamente en hechos reales, sin anécdotas personales ni diálogos inventados.
- Sin dinero, cronómetro, cuentas, avatar, generación automática de preguntas ni modo sin conexión.
- Objetivo de duración de 20–30 minutos, pendiente de validación con jugadores reales.

## Diseño y arquitectura aprobados

- React + TypeScript + Vite + Tailwind + shadcn/ui; React Router y TanStack Query.
- FastAPI + Pydantic; reglas puras en negocio, persistencia separada con SQLite/SQLAlchemy y migraciones Alembic.
- El backend es la única autoridad sobre respuestas, intentos, estado y rutas.
- Mapa SVG con d3-geo, cartografía Natural Earth incluida localmente, zoom, desplazamiento y vistas transatlántica/Europa/Estados Unidos.
- Estados de ciudad: actual, disponible, bloqueada, visitada y descartada. Lista accesible equivalente al mapa.
- Estética de atlas y pasaporte: crema, azul tinta y terracota; ilustraciones de lugares reales y sellos.
- Fuentes oficiales con URL y fecha de revisión para las escenas y preguntas. Recursos con licencias compatibles.
- Guardado anónimo mediante cookie HttpOnly de 180 días; estado persistente en servidor.
- Cada acción incluye UUID y versión esperada, con transacción, control de concurrencia e idempotencia.

## API ya planteada en código

- `GET /api/v1/catalog`: metadatos públicos y establecimiento de cookie anónima.
- `POST /api/v1/games`: `initialCityId`, `requestId`, `expectedGameId` al sustituir una partida.
- `GET /api/v1/games/current`: recuperación de progreso y proyección pública.
- `POST /api/v1/games/current/actions`: `gameId`, `requestId`, `expectedVersion`, acción discriminada.
- Acciones: `exploreScene`, `answerQuestion`, `chooseRoute`.
- La proyección pública excluye las respuestas correctas. Generar tipos TypeScript desde OpenAPI.

## Trabajo restante

1. Entorno Python y dependencias completados. Continuar la revisión funcional del código inicial junto con las pruebas de reglas.
2. Escribir `backend/app/data/content/v1.json` con las seis ciudades, 18 escenas y 18 preguntas documentadas. Este archivo todavía no existe; el backend no puede arrancar completamente sin él y sin migraciones.
3. Probar reglas, 120 itinerarios, derrota, reinicio, aislamiento, persistencia, solicitudes duplicadas y concurrencia; corregir los problemas encontrados.
4. Implementar toda la interfaz: actualmente no hay `frontend/src/`, pantallas ni componentes React.
5. Incorporar cartografía local, ilustraciones, mapa interactivo, selección inicial, escenas, preguntas, cuaderno, navegación y epílogo.
6. Generar tipos de API, pruebas frontend y Playwright (seis orígenes, derrota, continuación y móvil).
7. Documentar README, actualizar los comandos provisionales de AGENTS.md, añadir contenedor, volumen persistente e integración continua.
8. Ejecutar tests, lint, formato, tipos y build. No hay pruebas ni compilaciones verificadas todavía.
9. Revisar visualmente la interfaz y comprobar accesibilidad. Informar que la duración y dificultad requieren pruebas con personas.
10. Mostrar `git diff --stat` y `git log --oneline` al finalizar. Para PR, crear `dev` desde `main`, conforme a AGENTS.md; existe `develop`, pero no `dev`.

## Fuentes culturales ya consultadas

- Madrid: Ministerio de Cultura, historia del Museo Real/Prado; Prado, página de transparencia.
- Barcelona: web oficial de Sagrada Familia, historia del templo y Antoni Gaudí.
- París: Louvre, Grande Galerie y documentación oficial de la historia del museo.
- Roma: Parque Arqueológico del Coliseo, página del monumento y reutilización medieval.
- Nueva York: National Park Service, historia, estadísticas y personas de la Estatua de la Libertad.
- Washington: National Park Service, historia del National Mall y del Washington Monument.

Mantener los límites de uso de fuentes; redactar textos originales y verificar cada dato. Algunas URLs de Prado, simbología de Sagrada Familia y diseño del Lincoln Memorial no fueron accesibles: no usarlas como comprobadas.

Se leyó la skill Sites y su referencia de vista previa local. Se aplica el flujo local, sin registro ni publicación en Sites. Si se retoma automatización de navegador tras una compactación, seguir las instrucciones de reinicialización de la herramienta correspondiente.
