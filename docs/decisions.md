# Registro de Decisiones de Arquitectura y Diseño (ADR)

Este documento registra las decisiones técnicas tomadas durante el desarrollo del **Planificador de Cobertura Wi-Fi y Propagación de Ondas**, según lo estipulado en la sección 0 del documento de especificación.

---

## ADR-001: Estructura del Monorepo y Paquetes Iniciales
- **Fecha:** 2026-11-19
- **Estado:** Aceptado
- **Contexto:** La especificación técnica define un monorepo administrado con `pnpm` compuesto por `shared-types`, `geometry`, `physics-core`, `materials-db` y aplicaciones `web` y `api`.
- **Decisión:** 
  1. Configurar la raíz del espacio de trabajo con `pnpm-workspace.yaml`.
  2. Implementar los paquetes como módulos ESM puros con soporte TypeScript estricto.
  3. Establecer `physics-core` y `geometry` sin dependencias del DOM, compatibles al 100% tanto en Node.js como en Web Workers de navegador.

---

## ADR-002: Manejo de Unidades SI y Precisión de Cálculo
- **Fecha:** 2026-11-19
- **Estado:** Aceptado
- **Contexto:** Sección 0.2 exige unidades SI internas (metros, Hz, dBm, S/m), Float64 para cómputo intermedio y Float32 para almacenamiento de grids.
- **Decisión:**
  1. Las funciones físicas de FSPL, Fresnel, Snell y atenuación reciben y operan números en punto flotante estándar de JavaScript (doble precisión IEEE 754, equivalente a Float64).
  2. Los buffers finales de HeatmapGrid usan `Float32Array` para optimizar memoria y permitir transferencia rápida por `postMessage` o subida binaria.
  3. Los niveles de potencia se suman siempre en lineal (`mW`) utilizando la fórmula `P_linear = 10^(P_dBm / 10)` y se reconvierten a dBm únicamente en el paso final: `P_dBm = 10 * log10(P_linear)`.

---

## ADR-003: Tolerancia y Formulación Numérica de FSPL
- **Fecha:** 2026-11-19
- **Estado:** Aceptado
- **Contexto:** La fórmula analítica canónica es $FSPL = 20\log_{10}(4\pi d f / c)$. En la sección 8.2 se proporciona también la forma práctica simplificada $20\log_{10}(d) + 20\log_{10}(f_{\text{GHz}}) + 32.45$.
- **Decisión:**
  - Se implementa la constante exacta basada en $c = 299792458 \text{ m/s}$, donde $20\log_{10}(4\pi \cdot 10^9 / c) \approx 32.44778$.
  - Se garantiza que para $d = 1\text{ m}$ y $f = 2.4\text{ GHz}$, el resultado sea exactamente $40.05 \text{ dB}$ (con tolerancia $\pm 0.01\text{ dB}$ especificada en T1).
  - Para $d = 1\text{ m}$ y $f = 5.0\text{ GHz}$, el resultado sea exactamente $46.43 \text{ dB}$ (T2).
  - La distancia mínima se fija en $d_{\text{min}} = 0.1\text{ m}$ para evitar la singularidad en el router (T15).

---

## ADR-004: Modelo de Materiales e Interpolación de Frecuencia
- **Fecha:** 2026-11-19
- **Estado:** Aceptado
- **Contexto:** Los materiales tienen propiedades tabuladas en 2.4 GHz y 5.0 GHz. Si se consulta una frecuencia intermedia, se requiere interpolación lineal.
- **Decisión:**
  - El gestor `MaterialDB` busca la propiedad exacta si coincide con la frecuencia solicitada.
  - Si no coincide exactamente, busca los dos puntos más cercanos e intercala linealmente $\varepsilon_r$, $\sigma$ y la atenuación normal.
