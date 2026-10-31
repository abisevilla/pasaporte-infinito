# Estado de implementación — Pasaporte Infinito

Actualización: 30 de octubre de 2026. Implementación local autorizada; publicación externa fuera de esta entrega.

## Refactor de pantallas y teclado

- Celebración al ganar cada sello: mensaje «¡Ruta completada!», pasaporte abierto y animación de aplicación del sello de la ciudad. Se activa únicamente tras confirmar el servidor un sello nuevo, incluido el tercero antes del epílogo. Continuación con Enter y alternativa sin movimiento.

- Interfaz SPA a altura de ventana, sin scroll vertical: inicio, destinos, mapa, escenas, desafío, explicación de respuesta, epílogo, cuaderno, fuentes y ayuda separados.
- Texto paginado con medición del espacio real y adaptación al redimensionar; las fuentes largas también se reparten en páginas.
- Flechas para selección y lectura, Enter para confirmar, Escape/Retroceso para volver, H para ayuda y J para cuaderno. Tab y controles de ratón/táctiles conservados.
- Instrucciones visibles en la primera pantalla y guía permanente; ayuda detallada paginada.
- Navegar escenas no modifica la partida: solamente registrar y confirmar envían decisiones. Las reglas y la persistencia del backend se conservan.
- Pruebas nuevas para teclado, foco, diálogos, cuaderno, fuentes y ausencia de contenido recortado en ventanas de 320×568, 844×390, 640×360 y 320×480.

## Implementado

- Python 3.15.2 verificado en el sistema y `.venv/`; dependencias instaladas y fijadas en `backend/requirements.txt`.
- API FastAPI, contratos Pydantic, motor puro, SQLite/SQLAlchemy y migración Alembic inicial.
- Sesión anónima con cookie HttpOnly de 180 días, estado centralizado en servidor, control de versión y UUID de solicitud.
- Serialización de escrituras SQLite antes de leer el estado, para evitar carreras al crear partidas y guardar acciones.
- Catálogo `backend/app/data/content/v1.json`: seis ciudades, 18 escenas y 18 preguntas, con fuentes oficiales y fecha de revisión.
- React, TypeScript, Vite, Tailwind y componentes con patrones shadcn/ui y Radix: selector de destino, HUD, escenas, preguntas, viajes, cuaderno, confirmación de reinicio, derrota y epílogo.
- Mapa SVG con d3-geo/d3-zoom: Natural Earth local, vistas Atlántico/Europa/Estados Unidos, zoom, desplazamiento y lista accesible equivalente.
- Seis ilustraciones originales de monumentos, estética crema/azul tinta/terracota y diseño adaptable a móvil.
- Tipos TypeScript generados desde OpenAPI y consultas TanStack Query; las reglas y respuestas permanecen en el backend.
- README con instalación, migraciones, ejecución, configuración, pruebas, build y contenedor con volumen persistente.
- Flujo GitHub Actions para verificaciones y pruebas de navegador.
- Auditoría npm sin vulnerabilidades tras actualizar herramientas y fijar versiones corregidas de sus dependencias transitivas.

## Verificación

- Backend: 129 pruebas aprobadas, incluidos los 120 itinerarios, derrota, reinicio, aislamiento, persistencia, idempotencia, versiones obsoletas y concurrencia.
- Frontend: tres pruebas de componentes/API aprobadas; lint, tipos, formato y build comprobados.
- Playwright: 24 pruebas aprobadas, incluidas navegación por teclado, ventanas pequeñas sin scroll, juego/accesibilidad y entrega de la compilación desde FastAPI; seis orígenes, recuperación, viaje de tres ciudades, cuaderno, epílogo, derrota y reinicio en escritorio y móvil.
- Revisión de capturas generadas por las pruebas: atlas inicial y pantalla de partida, incluidas vistas móviles.
- Las pruebas completas detectaron y permitieron corregir el origen de desarrollo y el contador de escenas por ciudad.
- Auditoría automatizada de accesibilidad aprobada para selección y desafío en escritorio y móvil (WCAG 2 A/AA y 2.1 AA, reglas aplicables de axe-core).

## Contrato aprobado

- Juego individual en español: Madrid, Barcelona, París, Roma, Nueva York y Washington D. C.
- Elección inicial libre sin ciudad preseleccionada; tres ciudades distintas por partida, sin obligación de combinar continentes: 120 itinerarios ordenados.
- Tres escenas y un desafío de tres preguntas por ciudad; cuatro opciones y una respuesta correcta por pregunta.
- Tres errores por ciudad; el tercero termina la aventura. El contador se reinicia al viajar.
- Superar cada desafío concede un sello y permite elegir una ciudad no visitada. Al llegar al tercer destino se descartan los demás.
- Tres sellos completan la partida con un epílogo según el itinerario.
- Reiniciar permite elegir cualquiera de las seis ciudades.
- Hechos reales, sin anécdotas o diálogos inventados, dinero, temporizador, cuentas, avatar, preguntas generadas o modo sin conexión.

## Límites y seguimiento

- Docker no está instalado en este entorno: contenedor y volumen preparados, pendientes de ejecución real.
- GitHub Actions está preparado; su ejecución remota requiere subir los cambios.
- La duración objetivo de 20–30 minutos y la dificultad necesitan pruebas con jugadores reales. Los textos actuales son breves.
- La accesibilidad automatizada debe complementarse con evaluación manual y lectores de pantalla.
- El control del navegador mediante la herramienta de escritorio no estuvo disponible; se revisaron capturas de las pruebas automatizadas.
- No se ha hecho push ni publicación. El usuario incorporó el commit `948f5b0 initial implementation`; se conserva sobre la rama `feature/epic-1-juego-completo`.
- Para un PR futuro, seguir AGENTS.md: destino `dev`; no hacer push directo a `main`.

## API

- `GET /api/v1/catalog`: metadatos públicos y cookie anónima.
- `POST /api/v1/games`: `initialCityId`, `requestId`, `expectedGameId` al sustituir una partida.
- `GET /api/v1/games/current`: recuperación del estado público.
- `POST /api/v1/games/current/actions`: `gameId`, `requestId`, `expectedVersion`, acción discriminada (`exploreScene`, `answerQuestion`, `chooseRoute`).
- La proyección pública excluye las respuestas correctas. El epílogo se produce en negocio y se incorpora al contrato público.

## Siguiente revisión

Consultar README para arrancar el juego y comprobar Docker/CI donde estén disponibles. Para cambios de contenido, conservar la versión de las partidas existentes; el catálogo actual es `1.0.0`.
