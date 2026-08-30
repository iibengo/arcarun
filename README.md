# RUN·ARCADE 🕹️

Consola de entrenamiento retro/arcade para corredores. Selecciona una misión,
ajusta la marca de 10K y la energía del día, y genera una "foto rápida" con el
plan estructurado (calentamiento, bloque principal y enfriamiento) lista para
capturar.

## Stack

- [Nuxt 4](https://nuxt.com) + Vue 3 (`<script setup lang="ts">`)
- TypeScript estricto (`strict` + `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (tema OLED/neón en `app/assets/css/tailwind.css`)
- Vitest (tests de las funciones puras en `tests/unit/`)

## Estructura

```text
app/
├── assets/css/tailwind.css   # Única fuente de tema (tokens + estilos base)
├── components/               # UI sin lógica de negocio
├── composables/              # Estado reactivo y orquestación
├── pages/                    # index.vue (consola) + [...slug] (redirect a /)
└── utils/                    # Funciones puras: motor de ritmos, formateadores,
                              # catálogo de misiones, persistencia
tests/unit/                   # Tests Vitest (pace, formatters, persistence)
```

La lógica de negocio vive en funciones puras dentro de `app/utils/` (auto-importadas
por Nuxt). El catálogo base de misiones se define en `app/utils/missions.ts` y no se
persiste: añadir una misión nueva al código la hace visible para todos los usuarios.

## Scripts

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (http://localhost:3000)
npm test             # tests unitarios (Vitest)
npx nuxi typecheck   # verificación de tipos
npm run build        # build de producción
npm run preview      # previsualizar el build
```

## Nota sobre `content/`

Los archivos markdown de `content/` (`index.md`, `about.md`) son andamiaje del
starter de Nuxt Content y **no se renderizan**: la app arcade vive en `/` y la
ruta comodín redirige al inicio. Referencian componentes (`Alert`, `Counter`)
que ya no existen; se pueden eliminar sin afectar a la app.
