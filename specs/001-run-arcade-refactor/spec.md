# Feature Specification: Refactor de RUN·ARCADE

**Feature Branch**: `001-run-arcade-refactor`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "Refactor urgente del monolito a composables, components y utils puras; blindaje de persistencia; correcciones puntuales (cálculo de distancia en hills, limpieza de CSS duplicado y @theme, ruta comodín y componentes muertos). La contraseña del login se queda tal cual (parche temporal intencional)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La consola sigue funcionando idéntica tras el refactor (Priority: P1)

Como corredor que usa RUN·ARCADE a diario, quiero que la consola conserve exactamente la misma experiencia (menú de misiones, configuración por misión, foto rápida, misiones personalizadas, control de energía) después de la reorganización interna, para no tener que reaprender nada ni perder funcionalidad.

**Why this priority**: Es el requisito de no-regresión. El refactor no debe alterar ningún comportamiento observable; de lo contrario el valor entregado es negativo.

**Independent Test**: Se recorre el flujo completo de la app (login → seleccionar cada una de las 9 misiones → ajustar parámetros → generar foto rápida → crear/borrar misión personalizada → cambiar energía) y se verifica que cada pantalla y resultado es visual y numéricamente idéntico al estado previo al refactor.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado en el menú, **When** selecciona cualquiera de las misiones predefinidas, **Then** ve la pantalla de setup con los mismos controles, valores por defecto y cálculos de ritmo/km/tiempo que antes.
2. **Given** una misión personalizada creada por el usuario, **When** se guarda y se vuelve al menú, **Then** aparece en la cuadrícula con su icono, nombre, color y subtítulo, y es borrable.
3. **Given** la vista de setup, **When** el usuario pulsa "¡A JUGAR!", **Then** se muestra el overlay arcade "READY?" exactamente como antes.

---

### User Story 2 - La persistencia nunca rompe la app (Priority: P1)

Como usuario que lleva tiempo usando la consola, quiero que mi estado guardado (marca 10K, energía, parámetros y misiones personalizadas) se recupere de forma segura incluso si los datos guardados están corruptos, son de una versión antigua o contienen valores fuera de rango, para que la app nunca se quede en blanco ni falle al cargar.

**Why this priority**: Actualmente un `JSON.parse` fallido o un `energyIndex`/`time10k` fuera de rango rompe la app entera. Es el fallo más probable de tocar en producción.

**Independent Test**: Se inyecta en `localStorage` (clave `runArcadeState`) cada uno de estos valores y se recarga la app:
- cadena inválida (`"{no es json"`)
- `null` / objeto vacío
- `energyIndex: 99` / `time10k: 99`
- estado antiguo sin los campos nuevos de misiones
En todos los casos la app carga al menú sin errores.

**Acceptance Scenarios**:

1. **Given** `localStorage` contiene un JSON corrupto bajo `runArcadeState`, **When** la app carga, **Then** ignora el estado corrupto, usa los valores por defecto y muestra el menú sin errores.
2. **Given** `localStorage` contiene `energyIndex: 99`, **When** la app carga, **Then** el valor se corrige (clamp) al nivel válido más cercano y la UI de energía no se rompe.
3. **Given** `localStorage` contiene un estado antiguo sin las misiones más recientes, **When** la app carga, **Then** el catálogo de misiones se fusiona: se conservan las misiones personalizadas del usuario y aparecen las misiones nuevas del código.

---

### User Story 3 - La base de código es mantenible y tipada (Priority: P2)

Como desarrollador que mantiene RUN·ARCADE, quiero que la lógica esté separada en módulos con responsabilidad única (estado, motor de ritmos, formateadores, componentes de UI) y escrita en TypeScript estricto, para poder añadir misiones, ajustar ritmos o corregir bugs sin miedo a romper otras partes ni a errores de tipado en runtime.

**Why this priority**: El monolito de ~1090 líneas hace lento y arriesgado cualquier cambio. La separación y el tipado son la base que permite evolucionar el producto.

**Independent Test**: Se revisa la estructura del proyecto y se verifica que el archivo de página ya no contiene lógica de negocio, que el motor de ritmos y los formateadores son funciones puras importables, y que el proyecto compila con TypeScript estricto sin errores.

**Acceptance Scenarios**:

1. **Given** el código refactorizado, **When** se compila el proyecto, **Then** no hay errores de TypeScript y las funciones del motor de ritmos y formateadores son puras (misma entrada → misma salida, sin efectos laterales).
2. **Given** el archivo de página `[...slug].vue`, **When** se inspecciona, **Then** contiene únicamente composición de componentes y estado de navegación, sin catálogo de misiones ni cálculos inline.
3. **Given** el estado de la app, **When** se accede a parámetros de misión por clave (ej. `seriesReps`, `hillDuration`), **Then** el tipado garantiza que la clave existe y es del tipo correcto, evitando errores en runtime.

---

### User Story 4 - La tirada de cuestas estima la distancia completa (Priority: P2)

Como corredor que elige la misión CUESTAS, quiero que la distancia total estimada de la foto rápida incluya tanto el trabajo de subida como el trote de recuperación, para que el resumen no me muestre una distancia irrealmente corta.

**Why this priority**: Hoy la distancia de la misión CUESTAS solo cuenta la recuperación (bajada), infravalorando el total. Es una corrección de cálculo puntual con alto impacto percibido.

**Independent Test**: Con una marca 10K fija y energía NORMAL, se abre la misión CUESTAS con 8 repeticiones de 60s y recuperación ×2; la distancia total de la foto rápida debe ser mayor que el resultado anterior (que solo sumaba el trote de bajada) y consistente con el tiempo total estimado.

**Acceptance Scenarios**:

1. **Given** la misión CUESTAS con N repeticiones de T segundos y recuperación ×2, **When** se genera la foto rápida, **Then** la distancia total incluye el trabajo de subida más la recuperación.
2. **Given** cualquier combinación de reps/duración/energía, **When** se calcula la foto rápida, **Then** el tiempo total estimado y la distancia son coherentes entre sí (sin valores negativos ni división por cero).

---

### User Story 5 - Base visual y de rutas limpia (Priority: P3)

Como desarrollador, quiero una única fuente de verdad para el tema de Tailwind (sin CSS duplicado ni tokens repartidos), componentes de andamiaje eliminados, y una ruta comodín que no ensombrezca rutas de contenido, para reducir el tamaño del bundle y evitar conflictos de rutas futuros.

**Why this priority**: Son limpiezas de bajo riesgo que eliminan deuda técnica; el impacto visible es un bundle más pequeño y menos confusión al añadir páginas nuevas.

**Independent Test**: Se inspecciona la configuración y los assets: el tema (tokens de color) vive en un único archivo, no hay importaciones duplicadas de Tailwind, los componentes `Counter.vue`/`Alert.vue` no existen, y las rutas de contenido (ej. `/about`) no quedan capturadas por la ruta comodín.

**Acceptance Scenarios**:

1. **Given** la configuración de estilos, **When** se busca `@import "tailwindcss"` o `@theme`, **Then** solo aparece una vez en el pipeline global y el CSS del bundle no está duplicado.
2. **Given** la ruta `/about` (contenido markdown), **When** se navega a ella, **Then** no es capturada por la página comodín y la app arcade tampoco pierde funcionalidad.
3. **Given** el árbol de componentes, **When** se listan los componentes, **Then** solo existen los que la app usa realmente.

---

### Edge Cases

- ¿Qué pasa cuando `localStorage` no está disponible (modo privado, SSR, bloqueo del navegador)? → La app debe seguir funcionando en memoria sin lanzar excepciones.
- ¿Cómo gestiona el sistema un `JSON.parse` que lanza excepción? → Se ignora el estado guardado y se usan los valores por defecto.
- ¿Qué ocurre si el estado guardado tiene `energyIndex` o `time10k` fuera de los rangos definidos? → Se corrige con clamp al rango válido.
- ¿Qué ocurre si una misión restaurada de localStorage no tiene el campo `config` (versión antigua) o sus `params` referencian claves inexistentes? → La UI no debe romperse; se usan valores por defecto.
- ¿Qué ocurre si el usuario borra todas sus misiones personalizadas? → El menú sigue mostrando el catálogo base.
- ¿Qué pasa si una misión personalizada guardada en una versión antigua no tiene campos nuevos del formulario? → Los campos faltantes se rellenan con valores por defecto al fusionar.
- ¿Qué ocurre con `totalKm`/`totalSec` si los valores de entrada son extremos (ej. marca 10K en el límite de 30:00 o 60:00)? → Los cálculos no producen NaN, infinito ni negativos.
- ¿Qué pasa si el catálogo base en código añade una misión con el mismo `key` que una misión guardada modificada por el usuario? → El catálogo de código es la fuente de verdad para el comportamiento; las personalizaciones del usuario solo afectan a misiones personalizadas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app DEBE conservar todas las funcionalidades actuales (login, menú, setup, foto rápida, misiones personalizadas, energía, persistencia) con comportamiento observable idéntico tras el refactor.
- **FR-002**: La lógica de cálculo de ritmos y los formateadores DEBEN ser funciones puras, aisladas y reutilizables (sin dependencia de estado global).
- **FR-003**: El código DEBE estar escrito en TypeScript estricto y tipar el estado, los parámetros de misión y las claves de configuración para evitar errores de runtime.
- **FR-004**: El sistema DEBE cargar el estado persistido de forma segura: ante un `JSON.parse` fallido o datos no válidos, DEBE usar los valores por defecto sin lanzar errores.
- **FR-005**: El sistema DEBE validar y corregir (clamp) los valores restaurados a sus rangos válidos (marca 10K, índice de energía, parámetros de misión).
- **FR-006**: El sistema DEBE fusionar el catálogo de misiones persistido con el catálogo base del código, de modo que las misiones nuevas del código aparezcan para usuarios con estado antiguo y las misiones personalizadas del usuario se conserven.
- **FR-007**: El sistema DEBE persistir los cambios de configuración del usuario con debounce, sin perder datos al recargar.
- **FR-008**: La distancia total de la misión CUESTAS DEBE incluir el trabajo de subida más la recuperación.
- **FR-009**: El sistema DEBE mantener una única fuente de verdad para el tema visual (tokens de color y estilos base), sin CSS duplicado.
- **FR-010**: La ruta comodín NO DEBE capturar las rutas de contenido estático.
- **FR-011**: El proyecto NO DEBE contener componentes o archivos de andamiaje sin uso.
- **FR-012**: La contraseña de acceso DEBE permanecer tal cual está actualmente (parche temporal intencional, fuera del alcance de este refactor).

### Key Entities *(include if feature involves data)*

- **Mission**: Configuración de una misión (key, nombre, subtítulo, icono, color, tip, tipo, `planConfig.blocks`, `config` opcional). Puede ser base (definida en código) o personalizada (creada por el usuario, prefijo `custom_`).
- **UserSettings**: Preferencias guardadas del usuario (marca 10K en segundos, índice de energía, parámetros de misión como reps/distancia/duración).
- **PlanStep**: Paso del plan generado (tag, label, meta, pace, km, sec, hex, recPace opcional). Deriva de la misión + ajustes del usuario.
- **RunPlan**: Plan completo generado para la foto rápida (lista de `PlanStep`, total de km, total de segundos, tip del entrenador, misión).
- **PersistedState**: Estado completo serializado en `localStorage` (versión del esquema, `UserSettings`, catálogo de `Mission`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El flujo completo de la app (login → menú → setup → foto rápida → crear/borrar misión → energía) funciona sin regresión verificable tras el refactor.
- **SC-002**: La app carga correctamente en el 100% de los casos con datos de `localStorage` corruptos, nulos, fuera de rango o de versiones antiguas (antes: fallaba).
- **SC-003**: La distancia total de CUESTAS pasa de omitir el trabajo de subida a incluirlo en todos los casos probados.
- **SC-004**: El código compila con TypeScript estricto sin errores y el archivo de página queda por debajo de ~150 líneas de lógica propia (sin catálogo ni motor de ritmos inline).
- **SC-005**: El bundle de CSS no contiene estilos duplicados y el tema vive en un único archivo fuente.
- **SC-006**: El catálogo de misiones en código se puede ampliar con nuevas misiones y los usuarios con estado antiguo las verán sin necesidad de borrar su `localStorage`.

## Assumptions

- La contraseña del login ("Farah") se mantiene hardcodeada en cliente a propósito como parche temporal; no forma parte de este refactor.
- El comportamiento y aspecto visual de la app DEBEN permanecer idénticos; el refactor es puramente estructural.
- Se mantiene `localStorage` como mecanismo de persistencia; no se introduce backend ni cuentas de usuario.
- La app es de una sola página autocontenida; la ruta comodín se conserva pero no debe ensombrecer rutas de contenido estático.
- Se asume TypeScript estricto como estándar obligatorio del proyecto a partir de este refactor.
- Se asume que el proyecto usa el patrón de Nuxt 4 con directorio `app/` y que la estructura de archivos puede reorganizarse libremente mientras las rutas de página (catch-all) se conserven.
- Vitest se usará para validar las funciones puras (motor de ritmos, formateadores, lógica de persistencia/fusión) sin necesidad de montar la app completa.
