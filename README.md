# Planificador de Cobertura Wi-Fi y Propagación de Ondas

Simulación de cobertura inalámbrica en plantas 2D mediante trazado de rayos (*ray casting* y *ray tracing*) y modelos de propagación electromagnética (FSPL, Ley de Snell, coeficientes de reflexión y transmisión de Fresnel, medio dieléctrico con pérdidas).

Proyecto universitario avanzado / tesis de Ingeniería de Sistemas.

---

## 🏗 Arquitectura y Estructura del Monorepo

El proyecto está organizado como un monorepo administrado con `pnpm`:

```text
wifi-planner/
├─ apps/
│  ├─ web/                  # Frontend Vite + React + Konva + Web Workers
│  └─ api/                  # Backend NestJS + PostgreSQL + BullMQ (Fase 4)
├─ packages/
│  ├─ shared-types/         # Interfaces TypeScript y esquemas Zod compartidos
│  ├─ geometry/             # Álgebra 2D (Vec2), intersecciones, AABB, polígonos, snapping
│  ├─ physics-core/         # Núcleo de cálculo físico puro (sin DOM): FSPL, Snell, Fresnel, QuadTree
│  └─ materials-db/         # Catálogo de materiales con propiedades ITU-R P.2040
├─ docs/
│  ├─ uml/                  # Diagramas UML (Casos de uso, Clases, Secuencia, Estados, Componentes, Actividad)
│  └─ decisions.md          # Registro de decisiones de diseño y arquitectura (ADR)
└─ escena.json              # Escena arquitectónica de prueba para ejecución CLI
```

---

## 🚀 Requisitos e Instalación

### Requisitos previos
- **Node.js**: v20 o superior (recomendado v22+)
- **pnpm**: v9 o superior

### Instalación de dependencias
```bash
pnpm install
```

---

## ⚡ Comandos Disponibles

### 1. Ejecutar las pruebas unitarias y de validación física
Ejecuta la suite completa de pruebas numéricas de validación física obligatorias (**T1 a T15**, Sección 15 del documento técnico):
```bash
pnpm test
```

Para ejecutar únicamente los tests del paquete físico `physics-core`:
```bash
pnpm test:physics
```

### 2. Ejecutar la simulación por CLI en Node
Ejecuta la simulación de propagación electromagnética (Nivel A) sobre una escena JSON y genera un mapa ASCII de cobertura y métricas:
```bash
pnpm sim:cli escena.json
```

### 3. Compilar todos los paquetes
```bash
pnpm build
```

---

## 📊 Casos de Prueba Numéricos Validados (Sección 15)

| # | Prueba | Resultado Esperado | Estado |
|---|---|---|---|
| **T1** | FSPL ($d = 1\text{ m}, f = 2.4\text{ GHz}$) | $40.05\text{ dB}$ | ✅ Pasando |
| **T2** | FSPL ($d = 1\text{ m}, f = 5\text{ GHz}$) | $46.43\text{ dB}$ | ✅ Pasando |
| **T3** | Diferencia entre bandas ($5\text{ GHz} - 2.4\text{ GHz}$) | $6.38\text{ dB}$ | ✅ Pasando |
| **T4** | FSPL al duplicar distancia ($2d$) | $+6.02\text{ dB}$ | ✅ Pasando |
| **T5** | Ley de Snell ($n_1 = 1, n_2 = 1, \forall \theta_i$) | $\theta_t = \theta_i$ | ✅ Pasando |
| **T6** | Ley de Snell ($n_1 = 1.5, n_2 = 1, \theta_i = 60^\circ$) | $\sin\theta_t = 1.299 > 1 \implies$ TIR | ✅ Pasando |
| **T7** | Coeficiente de Fresnel normal ($\varepsilon_r = 4$, sin pérdidas) | $|\Gamma| = 1/3, R = 0.111$ | ✅ Pasando |
| **T8** | Ángulo de Brewster ($n_1 = 1, n_2 = \sqrt{5.31}, \theta_i \approx 66.5^\circ$) | $\Gamma_\parallel \approx 0 \ (< 10^{-9})$ | ✅ Pasando |
| **T9** | Conservación de energía sin pérdidas | $R + T_p = 1$ | ✅ Pasando |
| **T10** | Escena muro concreto ($10\text{ dB}$) a $5\text{ m}$, $2.4\text{ GHz}$, $P_{tx}=20\text{ dBm}$ | $P_{rx} = -44.03\text{ dBm}$ | ✅ Pasando |
| **T11** | Reflexión especular orden 1 (método de imágenes) | $L = \|S'R\|$; $\theta_i = \theta_r$ | ✅ Pasando |
| **T12** | QuadTree vs barrido lineal en 1 000 escenas aleatorias | Mismo conjunto de impactos | ✅ Pasando |
| **T13** | Suma incoherente de dos señales de $-60\text{ dBm}$ | $-56.99\text{ dBm}$ ($+3.01\text{ dB}$) | ✅ Pasando |
| **T14** | Dos caminos coherentes con $\Delta d = \lambda / 2$ | Cancelación total ($P \approx 0$) | ✅ Pasando |
| **T15** | Distancia mínima (celda del router $d = 0$) | Sin NaN ni $\infty$ ($d \ge 0.1\text{ m}$) | ✅ Pasando |
