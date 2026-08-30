# Feature Specification: Selector de nivel predeterminado (Fácil / Intermedio / Avanzado / Élite)

**Feature Branch**: `002-selector-nivel`

**Created**: 2026-08-30

**Status**: Approved

**Input**: User description: "Integrar una nueva sección de selección de niveles predeterminados (Fácil, Intermedio, Avanzado, Élite) justo encima del selector actual de 'MARCA 10K', siguiendo la estética de la app (tarjetas con bordes de colores y tipografía arcade). Sincronización bidireccional: al pulsar un nivel se calculan los ritmos correspondientes y se actualizan el valor numérico de 'MARCA 10K' y las tarjetas de entrenamiento inferiores, igual que con las flechas. Persistencia en localStorage del nivel y la marca asociada. El cambio se aplica al instante sin recargar."

**Decisiones confirmadas por el usuario (clarify)**:
1. Presets: Fácil 45:00 (2700 s), Intermedio 40:00 (2400 s), Avanzado 35:00 (2100 s), Élite 30:00 (1800 s).
2. Al afinar con las flechas, el resaltado sigue al **nivel más cercano** (opción a).
3. "Tarjetas de entrenamiento inferiores" = la foto rápida / `PlanCard`; las tarjetas del menú principal se quedan limpias (sin ritmos).
4. Paleta neón: Fácil verde `#39ff88`, Intermedio azul `#35c1ff`, Avanzado naranja `#ff8a1e`, Élite rojo `#ff4b3e`.

**Nota**: La captura adjunta por el usuario no pudo leerse (el modelo no soporta entrada de imágenes); la especificación se basa en la descripción textual y en el código actual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seleccionar nivel predeterminado actualiza la marca y los ritmos al instante (Priority: P1)

Como corredor que abre RUN·ARCADE, quiero poder pulsar una de las tarjetas de nivel (Fácil, Intermedio, Avanzado, Élite) en el menú y que la app ajuste automáticamente la marca de 10K y recalcule todos los ritmos de entrenamiento al momento, sin recargar la página, para configurar mi punto de partida con un solo toque.

**Why this priority**: Es el requisito central de la feature: el selector de nivel es la puerta de entrada a la configuración del entrenamiento.

**Independent Test**: Se abre el menú, se pulsa cada uno de los 4 niveles y se verifica que (a) el valor numérico de 'MARCA 10K' cambia al preset del nivel, (b) el resaltado del nivel activo es correcto, y (c) las tarjetas de entrenamiento / foto rápida muestran los nuevos ritmos derivados (misma salida que si se hubiera ajustado la marca con las flechas).

**Acceptance Scenarios**:

1. **Given** el menú con el selector de nivel visible, **When** el usuario pulsa la tarjeta "Intermedio", **Then** la marca 10K se fija al preset del nivel, la tarjeta queda resaltada como activa y todos los ritmos derivados se recalculan al instante.
2. **Given** un nivel activo, **When** el usuario pulsa otro nivel distinto, **Then** el resaltado se mueve al nuevo nivel y la marca 10K se actualiza al preset correspondiente.
3. **Given** cualquier nivel seleccionado, **When** se genera la foto rápida de cualquier misión, **Then** los ritmos/km/tiempos son exactamente los que produciría la misma marca 10K ajustada manualmente con las flechas.

---

### User Story 2 - Sincronización bidireccional entre nivel y flechas (Priority: P1)

Como usuario que ajusta la marca 10K con las flechas, quiero que el resaltado del nivel seleccionado se mantenga coherente con el valor numérico, para no perder la referencia de en qué nivel estoy aunque haya afinado el valor.

**Why this priority**: La "sincronización bidireccional" es un requisito explícito: nivel → marca (al pulsar un nivel) y marca → nivel (al usar flechas).

**Independent Test**: Se pulsa "Élite" (marca preset) y luego se sube la marca con las flechas; el resaltado del nivel debe permanecer en el nivel más cercano al valor actual. Se repite desde cada nivel.

**Acceptance Scenarios**:

1. **Given** el nivel "Élite" activo, **When** el usuario sube la marca con la flecha ▶ varias veces, **Then** el resaltado del nivel sigue al valor numérico (permanece en Élite mientras sea el preset más cercano y pasa al siguiente nivel al cruzar su punto medio).
2. **Given** un nivel activo, **When** el usuario pulsa las flechas hasta devolver la marca a un valor idéntico a otro preset, **Then** el resaltado se sitúa exactamente en ese nivel.
3. **Given** la marca 10K en el límite del rango (30:00 o 60:00), **When** se pulsa la flecha correspondiente fuera del rango, **Then** el valor no cambia (clamp existente) y el resaltado tampoco.

---

### User Story 3 - El nivel seleccionado y su marca persisten entre sesiones (Priority: P1)

Como usuario de la PWA, quiero que el nivel seleccionado y la marca 10K asociada se guarden en localStorage, para que al recargar la página o reabrir la app instalada se mantenga mi última selección junto con el resto de estados (energía, parámetros, misiones).

**Why this priority**: Es requisito explícito y la app ya persiste el resto del estado; el nivel debe integrarse en esa misma persistencia.

**Independent Test**: Se selecciona "Avanzado", se recarga la página (y se simula reabrir la PWA), y la app restaura el nivel Avanzado resaltado con su marca 10K. Se repite con cada nivel y con datos corruptos en localStorage.

**Acceptance Scenarios**:

1. **Given** un nivel seleccionado y guardado, **When** la página se recarga, **Then** el nivel vuelve a aparecer resaltado y la marca 10K restaurada coincide con el preset del nivel (o con el último valor afinado, manteniendo el nivel más cercano).
2. **Given** localStorage con estado antiguo (v2 sin campo de nivel) o con `levelKey` inválido, **When** la app carga, **Then** no rompe: el nivel se deriva de la marca 10K restaurada o usa el valor por defecto.
3. **Given** un cambio de nivel, **When** la app persiste con debounce, **Then** el nivel y la marca se guardan juntos y sobreviven a la recarga.

---

### User Story 4 - Estética arcade coherente (Priority: P2)

Como usuario de la consola, quiero que las tarjetas de nivel sigan la estética de la app (bordes de colores neón, tipografía arcade `font-display`, superficie OLED/panel), para que el selector se integre visualmente con el resto de la consola.

**Why this priority**: La integración visual es condición de aceptación del requisito ("siguiendo la estética de la app").

**Independent Test**: Se inspecciona el selector de nivel: usa tarjetas con borde de color por nivel, tipografía `font-display`, superficies `panel`/`panel-2`, y el nivel activo se distingue visualmente del resto.

**Acceptance Scenarios**:

1. **Given** el selector de nivel en el menú, **When** se inspecciona, **Then** cada nivel es una tarjeta con borde de color propio, texto en `font-display` y un estado visual diferenciado para el nivel activo.
2. **Given** la vista de menú en un móvil (ancho ~420px), **When** se muestra el selector, **Then** las 4 tarjetas se ven completas y accesibles sin scroll horizontal.

---

### Edge Cases

- ¿Qué ocurre si el usuario selecciona un nivel y luego afina con las flechas hasta un valor intermedio que no coincide con ningún preset? → El resaltado se mantiene en el nivel cuyo preset está más cerca del valor actual.
- ¿Qué ocurre si `localStorage` contiene un `levelKey` no válido (ej. `"extremo"`) o ausente? → Se ignora/deriva: el nivel se calcula como el preset más cercano a la marca 10K saneada (clamp incluido).
- ¿Qué ocurre si el usuario toca un nivel con la marca en el límite del rango (30:00)? → El preset Élite coincide con el mínimo del rango; el clamp existente sigue garantizando valores válidos.
- ¿Qué pasa si la marca 10K guardada no coincide exactamente con ningún preset? → El nivel se deriva al preset más cercano; el valor de la marca se conserva tal cual (no se fuerza el preset al recargar).
- ¿Se pierde el nivel al actualizar la app a una versión con el campo nuevo? → No: los estados previos sin `levelKey` cargan correctamente derivando el nivel de la marca.
- ¿La sección de nivel aparece también en la vista de setup? → No; por requisito explícito, solo "justo encima del selector de MARCA 10K" en el menú.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El menú DEBE mostrar una sección de selección de nivel (Fácil, Intermedio, Avanzado, Élite) situada justo encima del selector de 'MARCA 10K'.
- **FR-002**: Cada nivel DEBE tener asociado un preset de marca 10K (en segundos) dentro del rango válido [1800, 3600].
- **FR-003**: Al pulsar un nivel, DEBE actualizarse `time10k` al preset del nivel y el estado DEBE recalcular reactivamente todos los ritmos/tarjetas al instante, sin recargar la página.
- **FR-004**: El resaltado del nivel activo DEBE estar sincronizado bidireccionalmente: al pulsar un nivel se fija la marca; al ajustar la marca con las flechas, el nivel activo se actualiza al preset más cercano.
- **FR-005**: El nivel seleccionado DEBE persistirse en localStorage (junto con el resto de `UserSettings`) y restaurarse al cargar la app.
- **FR-006**: La carga DEBE ser tolerante: un `levelKey` ausente o inválido se deriva del valor de `time10k` saneado sin lanzar errores.
- **FR-007**: La sección DEBE respetar la estética arcade: tarjetas con borde de color por nivel, tipografía `font-display`, superficies `panel`/`panel-2` y estados visuales diferenciados (activo/inactivo).
- **FR-008**: La lógica de presets (mapping nivel ↔ marca, nivel más cercano) DEBE ser una función pura en `app/utils/`, testeable con Vitest.
- **FR-009**: No DEBE añadirse ninguna dependencia nueva al proyecto.

### Key Entities *(include if feature involves data)*

- **LevelKey**: Unión de claves de nivel (`'facil' | 'intermedio' | 'avanzado' | 'elite'`).
- **LevelPreset**: Definición de un nivel (`key`, `label`, `hex` de acento, `time10k` en segundos).
- **UserSettings.levelKey**: Nuevo campo opcional en el estado persistido; el nivel activo más cercano a `time10k`.
- **LEVELS**: Constante de presets (fuente de verdad en código), análoga a `ENERGY_LEVELS`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pulsar cualquiera de los 4 niveles actualiza el valor de 'MARCA 10K' al preset y recalcula la foto rápida sin recarga.
- **SC-002**: El resaltado del nivel se mantiene coherente al usar las flechas (nivel más cercano al valor numérico).
- **SC-003**: El nivel y la marca sobreviven a la recarga de la página / reapertura de la PWA (persistencia con debounce existente).
- **SC-004**: Estados de localStorage antiguos o con `levelKey` inválido cargan sin romper (derivación al preset más cercano).
- **SC-005**: `npm run test:run` pasa con los nuevos tests de presets y persistencia; `npm run build` compila con TypeScript estricto sin errores.

## Assumptions

- Presets confirmados (paso de 5 min, alineados al paso de 30 s de las flechas): Fácil 45:00 (2700 s), Intermedio 40:00 (2400 s), Avanzado 35:00 (2100 s), Élite 30:00 (1800 s). El valor por defecto actual (40:00) coincide con "Intermedio".
- Al afinar con las flechas hasta un valor intermedio, el resaltado se mantiene en el preset más cercano; en empate exacto (punto medio), gana el nivel más lento (determinista).
- El selector de nivel vive únicamente en el menú (`MissionMenu.vue`), justo encima del selector de 'MARCA 10K'.
- No se cambia el motor de ritmos existente: "calcular los ritmos correspondientes" = fijar `time10k` al preset y dejar que el motor reactivo recalcule (misma lógica que las flechas).
- Las tarjetas del menú principal NO muestran ritmos (se mantienen limpias); la propagación se verifica en la foto rápida (`PlanCard`) y en el valor de 'MARCA 10K'.
- La persistencia mantiene el esquema v2 con el campo `levelKey` añadido de forma retrocompatible (estados v2 antiguos sin `levelKey` cargan derivando el nivel de la marca).
