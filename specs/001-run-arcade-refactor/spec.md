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

### User Story 6 - La consola es instalable y funciona offline (PWA) (Priority: P1)

Como corredor que entrena fuera de casa (pista, parque, montaña) con cobertura móvil irregular, quiero poder instalar RUN·ARCADE en mi móvil como una app nativa (icono en el escritorio, pantalla completa sin barra del navegador) y poder abrirla y usarla **sin conexión**, para tener siempre mi foto rápida a mano aunque no haya red.

**Why this priority**: Es la evolución de producto que el usuario pidió explícitamente. La consola es 100% cliente (toda la lógica de ritmos y persistencia viven en el navegador), así que es candidata natural a PWA: bajo coste de implementación, alto valor percibido.

**Independent Test**: Se abre la app en un móvil (o DevTools con dispositivo simulado), se usa una vez con conexión, y luego:
- Desde el menú del navegador → "Instalar app" / "Añadir a pantalla de inicio" → aparece un icono de RUN·ARCADE.
- Se pone el dispositivo en modo avión y se abre la app desde el icono instalado → carga y funciona (login → menú → foto rápida) sin conexión.

**Acceptance Scenarios**:

1. **Given** la app desplegada en producción, **When** el navegador del móvil detecta el manifest, **Then** ofrece instalar la app con el nombre "RUN·ARCADE", icono de la consola y apertura en pantalla completa (standalone) con orientación vertical.
2. **Given** el usuario visitó la app al menos una vez con conexión, **When** abre la app sin conexión (modo avión), **Then** la consola carga y el flujo completo (login, menú de misiones, ajustes, foto rápida, misiones personalizadas) funciona normalmente usando el estado guardado localmente.
3. **Given** una nueva versión de la app desplegada, **When** el usuario reabre la app con conexión, **Then** el Service Worker se actualiza automáticamente y el usuario sigue viendo la versión más reciente.
4. **Given** el despliegue en Vercel, **When** se hace un build de producción y se sirve desde la CDN de Vercel, **Then** el `manifest`, el Service Worker y los iconos se sirven correctamente en la raíz y la instalación/offline funcionan sin configuración adicional de servidor.

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
- ¿Qué ocurre si el usuario abre la app instalada sin conexión en la **primera visita** (sin precaché previo)? → El Service Worker no puede servir la app; se muestra la pantalla offline del navegador. El soporte offline cubre "tras la primera visita con conexión" (escenario estándar de PWA).
- ¿Qué ocurre si el Service Worker intenta precachear archivos que cambian entre builds (hashes)? → El `registerType: autoUpdate` + precaché por hash de Workbox garantiza que los recursos antiguos se limpian (`cleanupOutdatedCaches`) y no hay mezcla de versiones.
- ¿Qué ocurre en el modo de desarrollo local (`npm run dev`)? → El Service Worker se desactiva en dev (`devOptions.enabled: false`) para evitar cachés que rompan el hot-reload; la PWA se valida sobre el build de producción.
- ¿Qué pasa si el navegador no soporta Service Worker (navegadores muy antiguos)? → La app sigue funcionando online como siempre; la instalación/offline simplemente no están disponibles.
- ¿Qué pasa si el usuario navega a una ruta comodín (`/ruta/desconocida`) estando offline? → El Service Worker debe servir el fallback a `/` (la consola) en lugar de un error de red.

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
- **FR-013**: La app DEBE ser instalable como PWA: el manifest DEBE declarar el nombre, colores de la consola arcade (fondo OLED `#050608` y acento neón verde `#39ff88`), iconos de la app, `display: standalone` (pantalla completa) y `orientation: portrait` (vertical).
- **FR-014**: La app DEBE registrar un Service Worker con soporte offline básico: tras la primera visita con conexión, la consola DEBE poder abrirse y usarse sin conexión (login, menú, ajustes, foto rápida y misiones personalizadas usan estado local).
- **FR-015**: El Service Worker DEBE actualizarse automáticamente cuando hay una nueva versión del build (autoUpdate) y DEBE limpiar los cachés de versiones anteriores.
- **FR-016**: La configuración PWA DEBE ser compatible con el despliegue en Vercel: el `manifest`, el `sw.js` y los iconos DEBEN servirse en la raíz del dominio sin requerir configuración de servidor adicional.
- **FR-017**: El modo de desarrollo local (`npm run dev`) NO DEBE activar el Service Worker (para no interferir con el hot-reload); la validación de la PWA se hace sobre el build de producción.

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
- **SC-007**: La app se puede instalar en el móvil (icono en pantalla de inicio, apertura en pantalla completa vertical) y, tras una visita con conexión, funciona sin conexión en el 100% del flujo core.
- **SC-008**: El despliegue en Vercel sirve el manifest y el Service Worker correctamente; la instalación y el modo offline se validan en el entorno de producción de Vercel sin cambios de configuración del servidor.

## Assumptions

- La contraseña del login ("Farah") se mantiene hardcodeada en cliente a propósito como parche temporal; no forma parte de este refactor.
- El comportamiento y aspecto visual de la app DEBEN permanecer idénticos; el refactor es puramente estructural.
- Se mantiene `localStorage` como mecanismo de persistencia; no se introduce backend ni cuentas de usuario.
- La app es de una sola página autocontenida; la ruta comodín se conserva pero no debe ensombrecer rutas de contenido estático.
- Se asume TypeScript estricto como estándar obligatorio del proyecto a partir de este refactor.
- Se asume que el proyecto usa el patrón de Nuxt 4 con directorio `app/` y que la estructura de archivos puede reorganizarse libremente mientras las rutas de página (catch-all) se conserven.
- Vitest se usará para validar las funciones puras (motor de ritmos, formateadores, lógica de persistencia/fusión) sin necesidad de montar la app completa.
- La PWA se implementa con el módulo `@vite-pwa/nuxt` (ecosistema estándar Nuxt); el Service Worker se sirve desde el output de build de Nuxt (`.output/public/`), compatible con la salida estática de Vercel.
- Los iconos de la app se generan y colocan en `public/` (o el directorio equivalente del output de build); se usa un diseño de la consola arcade (fondo OLED oscuro con acento neón).
- El soporte offline cubre el escenario estándar de PWA: funciona tras la primera visita con conexión; no se exige soporte offline en la primera visita ni para rutas de contenido del starter.
- La persistencia sigue siendo `localStorage`; la PWA no introduce almacenamiento adicional ni backend.
