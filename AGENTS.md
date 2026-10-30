---
description: "Cargar estas instrucciones al trabajar en la lógica del juego o en los componentes de interfaz de Pasaporte Infinito."
# applyTo: "**/*"
---

## Proyecto

Actúa como ingeniero de software de **Pasaporte Infinito**, un videojuego con un sistema narrativo basado en un grafo y un estado persistente centralizado. El objetivo del repositorio es desarrollar y mantener su lógica, narrativa e interfaz de forma coherente.

- **Frontend:** React con **shadcn/ui** para menús, paneles, diálogos, HUD y pantallas de juego accesibles y responsivos.
- **Backend:** Python + FastAPI.
- **Arquitectura por capas:** presentación, negocio, datos, infraestructura y compartido. Mantén las reglas y mecánicas independientes de la interfaz y de la persistencia.

## Comandos

Verifica los comandos y sus directorios de ejecución contra `package.json` y `README.md`; adapta los ejemplos a la configuración existente.

Actualmente el repositorio no contiene `package.json`, `requirements.txt` ni `README.md`. Los comandos siguientes son una referencia pendiente de verificación cuando se incorporen esos archivos; no asumas que ya están disponibles.

| Acción | Frontend (desde `frontend/`) | Backend (desde `backend/`) |
|---|---|---|
| Instalación | `npm install` | `python -m pip install -r requirements.txt` |
| Desarrollo | `npm run dev` | `python -m uvicorn app.main:app --reload` |
| Build | `npm run build` | Según `README.md`, si aplica |
| Pruebas | `npm test` | `python -m pytest` |
| Agregar componentes | `npx shadcn@latest add <componente>` | — |

Los pasos para ejecutar la aplicación en local, incluidas las configuraciones necesarias, deben documentarse en `README.md`. Consúltalo cuando esté disponible en lugar de duplicarlos aquí.

## Estructura del proyecto

Usa esta estructura como referencia para separar responsabilidades:

```text
pasaporte-infinito/
├── frontend/
│   ├── src/
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── ui/             # Componentes shadcn/ui
│   │   │   │   └── game/           # HUD, paneles y diálogos
│   │   │   └── screens/            # Menús y pantallas de juego
│   │   ├── business/
│   │   │   ├── game/               # Estado de cliente, reglas y mecánicas
│   │   │   └── narrative/          # Representación y navegación del grafo
│   │   ├── data/                   # Acceso a la API y adaptación de datos
│   │   ├── infrastructure/         # Configuración e integraciones
│   │   ├── shared/                 # Tipos y utilidades compartidos
│   │   └── assets/                 # Imágenes, audio y fuentes
│   ├── tests/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── presentation/           # Rutas y contratos HTTP de FastAPI
│   │   ├── business/
│   │   │   ├── game/
│   │   │   │   ├── state/          # Estado centralizado del juego
│   │   │   │   ├── rules/
│   │   │   │   └── mechanics/
│   │   │   └── narrative/          # Nodos, aristas y transiciones
│   │   ├── data/                   # Repositorios y persistencia del estado
│   │   ├── infrastructure/         # Base de datos e integraciones
│   │   └── shared/                 # Tipos y utilidades compartidos
│   ├── tests/
│   └── requirements.txt
├── .env                           # Local; no leer, mostrar ni editar
├── .env.example                   # Plantilla sin secretos
├── .gitignore
└── README.md
```

El backend mantiene el estado persistente centralizado; el estado del frontend debe permanecer sincronizado con él. Evita duplicar reglas de negocio entre capas.

## Convenciones de código

- Usa **camelCase** para variables y funciones.
- Usa **PascalCase** para clases y componentes React, y **kebab-case** para archivos de componentes: `GameHud` en `game-hud.tsx`. El nombre del símbolo y el del archivo siguen convenciones distintas.
- Escribe comentarios y documentación en español.
- Respeta la separación por capas: la presentación consume la lógica de negocio y no accede directamente a la persistencia.

## Git

- Usa Conventional Commits: `tipo(alcance): descripción`.
- Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test` y `chore`.
- Para una nueva feature, crea una rama desde `main` con el formato `feature/epic-[numero epic]-nombre`.
- No hagas push directo a `main`. Crea un Pull Request dirigido a `dev` para revisión y aprobación antes del merge.
- Al terminar una tarea, muestra un resumen con `git diff --stat` y `git log --oneline`.

## Verificación de código

- Antes de cada commit, ejecuta `npm test` y las pruebas del backend cuando aplique. Corrige los fallos antes de confirmar los cambios.
- Ejecuta las herramientas de linting y formateo configuradas en el repositorio para mantener la calidad y consistencia del código.

## Seguridad

- No leas, muestres ni edites `.env`, `.env.local` ni archivos con API keys, contraseñas o información sensible.
- No almacenes información sensible en el código fuente.
- Usa variables de entorno para datos sensibles y configuraciones específicas del entorno.
- Mantén `.env.example` libre de secretos y excluye los archivos sensibles del control de versiones mediante `.gitignore`.
