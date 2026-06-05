# QA Automation Engineer — Technical Test

API test automation framework for [FakeStoreAPI](https://fakestoreapi.com/) and [GoRest](https://gorest.co.in/), built with **Node.js · TypeScript · Playwright · Cucumber BDD · K6**.

---

## Stack

| Tool | Purpose |
|------|---------|
| Node.js 20 | Runtime |
| TypeScript 5 | Type safety across the codebase |
| Playwright | HTTP client via `APIRequestContext` |
| Cucumber 10 + Gherkin | BDD test definitions |
| cucumber-html-reporter | Visual HTML reports from JSON output |
| K6 | Load, stress, and spike performance tests |
| GitHub Actions | CI/CD pipeline |

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/maicolparrado93/playwright-bdd-challenge
cd qa-automation-test
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your GoRest token:
# GOREST_TOKEN=<token from https://gorest.co.in/my-account/access-tokens>

# 3. Install Playwright browsers (only needed for Playwright's internal deps)
npx playwright install --with-deps chromium
```

---

## Running Tests

```bash
# Smoke suite (fast, ~2 min)
npm run test:smoke

# Full regression (smoke + regression tags)
npm run test:regression

# Only FakeStore tests
npm run test:fakestore

# Only GoRest lifecycle tests
npm run test:gorest

# All tests
npm test

# All tests + generate HTML report
npm run test:all

# Generate HTML report from existing JSON
npm run report
```

Reports are saved to `reports/`. Open `reports/cucumber-report.html` in a browser.

---

## Project Structure

```
├── features/
│   ├── fakestore/
│   │   ├── products.feature     # Catalog CRUD
│   │   ├── carts.feature        # Cart management
│   │   ├── users.feature        # User profiles
│   │   └── auth.feature         # Login / authentication
│   └── gorest/
│       └── user-lifecycle.feature  # Full E2E lifecycle
├── src/
│   ├── api/
│   │   ├── clients/
│   │   │   ├── FakeStoreClient.ts  # Wrapper over Playwright APIRequestContext
│   │   │   └── GoRestClient.ts
│   │   └── types/index.ts          # TypeScript interfaces for all resources
│   ├── step-definitions/
│   │   ├── common/common.steps.ts  # Shared steps (status, body assertions)
│   │   ├── fakestore/              # Domain-specific steps
│   │   └── gorest/
│   └── support/
│       ├── world.ts                # Cucumber World — shared state per scenario
│       └── hooks.ts                # Before/After — context setup & cleanup
├── k6/
│   ├── load-test-products.js       # 50 VUs sustained — catalog browse
│   ├── stress-test-users.js        # Progressive ramp to 200 VUs — find the limit
│   └── spike-test.js               # Abrupt 20x traffic surge — flash sale
└── .github/workflows/
    ├── ci.yml                      # Smoke on PR, regression on merge, nightly schedule
    └── performance.yml             # Weekly K6 suite
```

---

## Architecture Decisions

### Why Playwright for API testing?
Playwright's `APIRequestContext` provides a first-class HTTP client with built-in retry, timeout, and assertion helpers — without the overhead of a browser. It integrates naturally with TypeScript and has excellent error output, which is valuable for CI feedback.

### Why API Client classes?
`FakeStoreClient` and `GoRestClient` wrap the raw Playwright context. This separates the "how to call the API" concern from the "what to assert" concern in step definitions, and makes the client trivially replaceable (e.g. for mocking in unit tests) without touching any Gherkin step.

### Tag strategy
- `@smoke` — critical happy-path scenarios only; must run in < 5 min
- `@regression` — full business-rule coverage; run nightly or on merge
- `@fakestore` / `@gorest` — service-scoped execution for focused debugging

---

## Part 1 — API Automation Q&A

### 1. ¿Qué aspectos mejorarías si tuvieras más tiempo?

- **Contract testing con PACT** — validar que el contrato del proveedor no cambia entre versiones, sin depender de un entorno activo.
- **JSON Schema validation** — verificar la estructura del cuerpo de respuesta contra un schema formal, no solo propiedades individuales.
- **Retry logic configurable** — reintentos automáticos con backoff exponencial para distinguir flakiness real de errores transitorios del API.
- **Data factories** — en lugar de datos hardcodeados en el Gherkin, usar factory functions que generen payloads válidos y variados.
- **Boundary value testing** — precios negativos, strings vacíos, campos con longitud máxima, tipos incorrectos (string donde se espera int).
- **Security basics** — verificar que campos como `password` no se devuelven en respuestas GET.

### 2. ¿Cómo parametrizarías el test para ejecutarlo en distintos ambientes?

Tres capas de configuración:

```
# .env.staging
FAKESTORE_BASE_URL=https://fakestoreapi.com
GOREST_BASE_URL=https://gorest.co.in/public/v2
TEST_ENV=staging

# .env.dev
FAKESTORE_BASE_URL=http://localhost:3000
TEST_ENV=development
```

```json
// package.json scripts
"test:staging": "dotenv -e .env.staging -- npm test",
"test:dev":     "dotenv -e .env.dev     -- npm test"
```

En CI, las variables vienen de GitHub Environments (`staging`, `production`), que tienen sus propios secrets y variables de entorno. El código nunca referencia un ambiente hardcodeado.

### 3. ¿Cómo gestionarías datos sensibles (tokens, passwords)?

| Contexto | Mecanismo |
|----------|-----------|
| Local | `.env` (en `.gitignore`); nunca commitear |
| CI/CD | GitHub Secrets → inyectados como variables de entorno |
| Producción/Compliance | HashiCorp Vault o AWS Secrets Manager con rotación automática |
| Código | `process.env.TOKEN` — nunca strings hardcodeados |
| Logs | Enmascarar tokens (`::add-mask::` en GitHub Actions) |
| Revisión de código | `git-secrets` o `trufflehog` en pre-commit hooks |

Adicionalmente: tokens de prueba con permisos mínimos (solo los endpoints necesarios), y rotación periódica.

### 4. ¿Qué estrategia usarías para evitar flakiness?

1. **Tests atómicos e independientes** — cada scenario crea sus propios datos y los limpia en el `After` hook; no depende del orden de ejecución ni del estado dejado por otro test.
2. **Emails únicos por ejecución** — `qa_test_${Date.now()}_${random}@example.com` previene colisiones entre runs paralelos o reintentos.
3. **Cleanup en `After`, no en `Before`** — si el Before falla, los datos del run anterior quedan sin limpiar; el After garantiza que se limpian incluso si el test falla.
4. **Retry controlado** — máximo 2 reintentos solo para scenarios marcados con `@flaky`, con logging que distinga el reintento del fallo real.
5. **Timeouts explícitos** — `request.newContext({ timeout: 10_000 })` evita que tests cuelguen indefinidamente por lentitud del API externo.
6. **Monitoreo del API tercero** — si el API externo tiene una página de status, integrar una verificación previa a la suite (`BeforeAll`) que avise en lugar de fallar silenciosamente.

### 5. ¿Cómo estructurarías la suite para separar smoke vs regression?

```
Smoke (@smoke)
├── 1 scenario por endpoint crítico (happy path)
├── Ejecución: < 5 minutos
├── Cuándo: en cada PR y antes de cualquier deploy
└── Objetivo: "¿El sistema está en pie?"

Regression (@smoke or @regression)
├── Casos límite, manejo de errores, flujos alternativos
├── Ejecución: ~20-30 minutos
├── Cuándo: merge a main/develop, ejecución nocturna
└── Objetivo: "¿Rompimos algo?"
```

En GitHub Actions:
- **PR** → dispara solo `test:smoke`
- **Merge a main** → dispara `test:regression`
- **Cron 02:00 UTC** → dispara `test:regression` completo con reporte archivado

---

## Part 2 — CI/CD Q&A

### 1. ¿Cómo ejecutar solo Smoke en PR y Regression nightly?

```yaml
# ci.yml — smoke en PR
on:
  pull_request:
jobs:
  smoke:
    if: github.event_name == 'pull_request'
    run: npm run test:smoke

# nightly regression
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  nightly:
    if: github.event_name == 'schedule'
    run: npm run test:regression
```

El `if:` en cada job asegura que cada trigger ejecuta únicamente la suite correspondiente.

### 2. ¿Cómo manejar variables sensibles sin exponerlas?

1. En GitHub → Repository Settings → Secrets and Variables → Actions → `New repository secret`
2. Crear `GOREST_TOKEN` con el valor del token
3. En el workflow: `env: GOREST_TOKEN: ${{ secrets.GOREST_TOKEN }}`
4. GitHub enmascara automáticamente el valor en los logs (aparece como `***`)
5. Para auditoría: usar GitHub Environments con `required reviewers` antes de que un job acceda al secret

Nunca usar `echo $GOREST_TOKEN` en scripts — en su lugar: `echo "Token length: ${#GOREST_TOKEN}"` si necesitas depurar.

### 3. ¿Qué harías si el pipeline falla por intermitencia del API externo?

**Estrategia en capas:**

1. **Retry en el pipeline** — el job repite la suite una vez con `sleep 30` entre intentos (ya implementado en el job `nightly`).
2. **Retry en el test runner** — usar `@retry(2)` tag en Cucumber para scenarios con dependencia externa.
3. **Clasificar el fallo** — si el 100% de los tests fallan, probablemente es el API externo; si fallan subconjuntos específicos, probablemente son bugs reales.
4. **Health check previo** — `BeforeAll` hace un `GET /products` y si devuelve 5xx, salta toda la suite con un mensaje claro: "External API unavailable — tests skipped".
5. **Alertas diferenciadas** — Slack/email indica "API externo no disponible" vs "Test fallido por bug".

### 4. ¿Cómo versionarías y almacenarías evidencias?

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: regression-report-${{ github.run_number }}-${{ github.sha }}
    path: reports/
    retention-days: 90
```

- Nombre del artifact incluye `run_number` + `sha` → rastreable a un commit exacto.
- `retention-days: 90` para PR/nightly, 365 para releases (compliance).
- Para auditoría a largo plazo: script que copia artifacts a S3/GCS con prefijo `YYYY/MM/DD/`.
- Reportes de K6 en el mismo artifact con raw JSON para re-análisis posterior.

### 5. ¿Qué métricas incorporarías?

| Métrica | Cómo medirla | Dónde verla |
|---------|-------------|-------------|
| Duración de suite | `Date.now()` en `BeforeAll`/`AfterAll` | Cucumber JSON → HTML report |
| Pass/fail rate por feature | Cucumber JSON parser | HTML report, Slack notification |
| Flakiness rate | Tests que pasan en reintento / total | Script post-CI que compara runs históricos |
| Tiempo promedio por step | Cucumber JSON `result.duration` | Trend en Grafana |
| Cobertura de endpoints | Contar steps únicos por cliente HTTP | Report personalizado |

Con más tiempo: integrar [Allure](https://allurereport.org/) que tiene historial de ejecuciones, trend charts y flakiness tracking out-of-the-box.

---

## Part 3 — Performance Analysis

> Tests executed on 2026-06-05 against live public APIs (FakeStoreAPI + GoRest).  
> Raw JSON results: `k6-results/load-test-summary.json`, `stress-test-summary.json`, `spike-test-summary.json`.

### Load Test — Catálogo de Productos (FakeStoreAPI GET /products)

**Configuración:** 50 VUs — ramp 1 min → hold 3 min → ramp down 1 min

| Métrica | Valor | Threshold | Estado |
|---------|-------|-----------|--------|
| p(95) response time | **254 ms** | < 2 000 ms | ✅ PASS |
| p(90) response time | 203 ms | — | — |
| Avg response time | 195 ms | — | — |
| Median | 187 ms | — | — |
| Max (outlier) | 19 526 ms | — | — |
| Throughput | 23.57 req/s | — | — |
| Total requests | 7 124 | — | — |
| Error rate | **0.00 %** | < 1 % | ✅ PASS |
| Checks passed | 100 % | — | — |

**Observaciones:** FakeStoreAPI respondió consistentemente con p(95) de 254 ms bajo 50 VUs concurrentes, muy por debajo del threshold de 2 000 ms. El outlier de 19 526 ms corresponde a una única iteración en el ramp-up inicial — no representa degradación sostenida. No se registraron errores en ninguna de las 7 124 requests.

---

### Stress Test — Registro de Usuarios (GoRest POST /users)

**Configuración:** 0 → 200 VUs progresivamente (warm-up 30 s, ramp en 4 etapas de 1 min, hold 2 min, recovery 1 min)

| Métrica | Valor | Threshold | Estado |
|---------|-------|-----------|--------|
| p(95) response time | **1 107 ms** | < 10 000 ms | ✅ PASS |
| p(90) response time | 946 ms | — | — |
| Avg response time | 870 ms | — | — |
| Median | 464 ms | — | — |
| Max | 60 001 ms (timeout) | — | — |
| Throughput | 90.04 req/s | — | — |
| Total requests | 40 598 | — | — |
| Rate-limited (HTTP 429) | **36 618 (90.2 %)** | — | — |
| http_req_failed | 94.4 % | < 50 % | ❌ FAIL |

**Observaciones:** GoRest aplica **rate limiting agresivo** — el 90.2 % de las requests recibieron HTTP 429. Este es el hallazgo central del stress test. El threshold `http_req_failed < 50 %` falló intencionalmente: fue diseñado para ser provocado, no para bloqueante. Puntos clave:

- **Punto de quiebre:** visible desde ~50–100 VUs. A 150–200 VUs prácticamente todas las requests son rechazadas.
- **Degradación gradual vs abrupta:** el sistema no colapsa — devuelve 429 correctamente en lugar de 5xx, lo que indica que el rate limiting está implementado como protección activa.
- **p(95) de requests no limitadas:** ~400–500 ms, lo que sugiere que el backend en sí es estable; el cuello está en la política de throttling.
- **Recovery:** al volver a 0 VUs las requests vuelven a tener éxito sin reinicio.

---

### Spike Test — Pico de Tráfico (FakeStoreAPI — Flash Sale)

**Configuración:** baseline 5 VUs → spike súbito a 100 VUs en 10 s → hold 2 min → recovery a 5 VUs

| Métrica | Valor | Threshold | Estado |
|---------|-------|-----------|--------|
| p(95) response time | **200 ms** | < 4 000 ms | ✅ PASS |
| p(90) response time | 192 ms | — | — |
| Avg response time | 189 ms | — | — |
| Median | 187 ms | — | — |
| Max (durante spike) | **2 144 ms** | — | — |
| Throughput | 42.22 req/s | — | — |
| Total requests | 11 428 | — | — |
| Error rate | **0.00 %** | < 5 % | ✅ PASS |

**Observaciones:** FakeStoreAPI absorbió el pico de 20x (5 → 100 VUs en 10 s) sin un solo error. El max de 2 144 ms ocurrió en los primeros segundos del spike y se normalizó inmediatamente — el p(95) global de 200 ms incluye esa absorción. El sistema mostró resiliencia total ante tráfico abrupto.

---

### Análisis Crítico — Preguntas de la Prueba

#### 1. ¿Qué cuellos de botella identificaste?

| Sistema | Cuello de botella | Evidencia |
|---------|------------------|-----------|
| GoRest | **Rate limiting** (429 en 90.2 % de requests bajo carga extrema) | 36 618 requests bloqueadas sobre 40 598 totales |
| FakeStoreAPI | **Network latency** (servicio externo, sin control) | Max outlier de 19 526 ms en load test; p(95) nominal de 254 ms |
| Spike | No se identificó cuello — el sistema absorbió el pico sin degradación | p(95) = 200 ms con 0 % errores |

El rate limiting de GoRest es el cuello dominante. En un sistema propio, el cuello real estaría en escrituras concurrentes a la DB (contención en la columna `email` con unicidad forzada) y en el I/O de conexiones al pool.

#### 2. ¿Cómo interpretaste los resultados?

**Métricas más relevantes para cada test:**

- **Load test → p(95)**: el percentil 95 es el SLO estándar de negocio. El p(50) es demasiado optimista; el máximo es demasiado volátil por outliers. p(95) = 254 ms confirma que el 95 % de los usuarios reales tendrán una experiencia dentro del umbral aceptable.
- **Stress test → tasa de rate limiting**: el indicador clave no es el error rate bruto (distorsionado por los 429), sino cuántos requests reales llegaron al backend. 36 618 bloqueados de 40 598 totales (90.2 %) muestra que el sistema de throttling funciona como barrera de protección.
- **Spike test → max y recovery**: el máximo durante el spike (2 144 ms) y la velocidad con que volvió a baseline (inmediata) demuestran que la infraestructura tiene headroom suficiente para absorber flash sales sin degradación sostenida.

#### 3. ¿Qué mejoras propondrías?

| Área | Problema identificado | Mejora propuesta |
|------|----------------------|-----------------|
| Catalog reads | Latencia de red a API externa | CDN propio + `Cache-Control: max-age=60` para el catálogo — reduce p(95) de ~250 ms a < 30 ms para usuarios con cache |
| User registration | Rate limiting bloquea campañas masivas | Queue asíncrona (SQS/RabbitMQ) + worker pool: el frontend confirma "registro en cola", el backend procesa sin presionar la API |
| DB writes | Contención en unicidad de email bajo concurrencia | Índice parcial en `email` + conexión a réplica de lectura para verificaciones previas |
| Spike resilience | Sin auto-scaling visible en API pública | Pre-warmed instances + circuit breaker (Hystrix/Resilience4j): en lugar de colar requests, responde 503 rápido y protege el backend |
| Observabilidad | Sin visibilidad de degradación en tiempo real | Grafana + InfluxDB para métricas en vivo; alertas cuando p(95) > 1 500 ms |

#### 4. ¿Cómo integrarías estas pruebas en CI/CD?

Ya implementado en `performance.yml`. Para una integración más robusta:

```yaml
# Quality gate: bloquear deploy si p(95) > 1500 ms
- name: Run load test
  run: k6 run k6/load-test-products.js
  # k6 exits with code 99 if thresholds are breached → el job falla → bloquea el merge

# Ejecución programada separada de la suite funcional
on:
  schedule:
    - cron: '0 3 * * 1'   # Lunes 03:00 UTC — no interfiere con nightly funcional
  workflow_dispatch:       # Manual para tests antes de un evento especial (flash sale)
```

Estrategia: los tests de performance **no corren en cada PR** (son costosos en tiempo y afectan APIs compartidas). Corren en schedule semanal y `workflow_dispatch` manual antes de eventos críticos. Los resultados JSON se archivan como artifacts con retención de 90 días para comparación de tendencias.

#### 5. ¿Qué herramientas adicionales usarías para monitoreo en producción?

| Capa | Herramienta | Qué aporta |
|------|-------------|------------|
| APM | **DataDog APM** o **New Relic** | Trazas distribuidas end-to-end, detección automática de anomalías |
| Métricas | **Grafana + Prometheus** | Dashboards en tiempo real, alertas con Alertmanager |
| Resultados K6 | **Grafana + InfluxDB** | Overlay de runs históricos para detectar regresiones de performance |
| Logs | **ELK Stack** (Elasticsearch + Kibana) | Correlación entre errores de performance y logs de aplicación |
| Sintético | **Checkly** o **Datadog Synthetics** | Health checks continuos cada 1 min desde múltiples regiones |

En un entorno real, K6 en CI complementa (no reemplaza) el monitoreo APM en producción: K6 detecta regresiones antes del deploy; el APM detecta incidentes en producción con tráfico real.

---

## Part 4 — Technical Questions

### 1. Arquitectura y Diseño — Feedback a un desarrollador

**Los problemas que vería:**

```
❌ Steps duplicados          → Viola DRY; un cambio requiere actualizar N lugares
❌ Locators hardcodeados     → Fragilidad: un cambio en el API rompe todos los tests
❌ Datos embebidos en código → Dificultad para variar escenarios; tests no son datos-driven
❌ Sin manejo de errores     → Fallo silencioso; no sabemos por qué falló
```

**Cómo explicarlo y qué enseñar:**

> "El objetivo de una buena suite de tests es que sea tan fácil de mantener como el propio código de producción. Hay cuatro principios que aplican aquí:"

1. **DRY en steps**: extraer el `Then the response status should be {int}` a un `common.steps.ts` compartido. Un step = una definición.
2. **API Client pattern** (equivalente al Page Object Model): centralizar todas las llamadas HTTP en clases cliente. El step definition nunca construye una URL — llama a `client.getProduct(id)`. Si el endpoint cambia, actualizas un solo lugar.
3. **Separación datos / lógica**: los datos de prueba van en tablas Gherkin, archivos fixtures, o factories. El código de automatización no debería tener strings mágicos como `"user123@test.com"`.
4. **Fail fast con mensajes útiles**: un `expect(status).toBe(200)` que falla solo dice "esperaba 200, obtuve 422". Añadir contexto: `expect(status, `POST /users failed: ${body.message}`).toBe(201)` hace el debug 10x más rápido.

### 2. Calidad vs Velocidad — ¿Release o no?

**Lo que haría:**

1. **Clasificar los bugs por impacto**: un bug en el flujo de pago es bloqueante; un bug en el filtro de color no lo es. No todos los failures bloquean un release.
2. **Presentar evidencia objetiva al negocio**: screenshot + steps to reproduce + impacto estimado (cuántos usuarios afecta, pérdida de revenue estimada). No "hay bugs", sino "este bug bloquea el checkout para el 30% de los usuarios mobile".
3. **Proponer opciones con trade-offs**:
   - Release con feature flag desactivado → release on time, riesgo controlado
   - Release parcial (sin el módulo afectado) → reduce riesgo, más trabajo de coordinación
   - Postponer 1 día para fix crítico → máxima calidad, menor velocidad
4. **La decisión es del negocio, no del QA**: mi rol es dar información completa y clara; el PM/PO decide asumiendo el riesgo conscientemente.
5. **Documentar**: cualquiera que sea la decisión, queda en el bug tracker con la fecha, quién aprobó el release, y el riesgo aceptado.

### 3. Conflicto con Desarrollo — "El test está mal"

**Cómo resolverlo de forma objetiva:**

1. **No es personal — es la evidencia**: preparar un reporte con: endpoint, payload exacto, respuesta esperada (según spec/docs), respuesta obtenida, y pasos para reproducirlo manualmente (sin el test).
2. **Reproducir manualmente juntos**: si el bug se reproduce con Postman o curl en 2 minutos, la conversación termina ahí. Si no se reproduce, puede que el test tenga un problema de entorno.
3. **Revisar la especificación**: ¿qué dice el contrato/docs? Si la spec es ambigua, la ambigüedad ES el bug — hay que clarificarla antes de continuar.
4. **Si hay desacuerdo genuino**: escalar a un tercer árbitro (Tech Lead, PO) con evidencia de ambas partes. La decisión se basa en la spec, no en opiniones.
5. **Actualizar la documentación**: sea bug o comportamiento esperado, asegurarse de que la spec refleje el comportamiento real para que no vuelva a pasar.

El objetivo es resolver el problema, no ganar la discusión.

### 4. Estrategia de Pruebas para equipo con poca automatización

**Plan en 4 fases (ajustado a releases cada 2 semanas):**

**Semana 1–2: Foundation**
- Setup del framework (este repo sirve como plantilla)
- CI/CD básico con GitHub Actions
- Definir qué es "smoke" para este producto (10–15 scenarios críticos)
- Automatizar SOLO el smoke suite

**Semana 3–4: Coverage crítica**
- Identificar los módulos con mayor frecuencia de bugs (mirar el historial de issues)
- Automatizar esos módulos primero (máximo ROI)
- Establecer la regla: "ningún PR pasa sin que el smoke suite pase"

**Mes 2–3: Regression suite**
- Agregar casos de error, casos límite, y flujos alternativos
- Introducir tests de contrato para APIs consumidas por el frontend
- Medir: ¿cuánto tiempo se ahorra en regresión manual?

**Ongoing: Culture shift**
- Cada nuevo bug que llega a producción → se convierte en un test automatizado
- Los developers escriben los criterios de aceptación en Gherkin junto con el QA
- Flakiness rate como KPI del equipo: si sube, paramos y lo arreglamos

**Clave**: no tratar de automatizar todo de golpe. Priorizar por riesgo y frecuencia de cambio.

### 5. ROI de la Automatización

**La respuesta honesta sobre "las pruebas manuales son rápidas":**

Las pruebas manuales son rápidas la primera vez. El problema es que se ejecutan en cada release.

**Argumento con números:**

```
Regresión manual:       3 QAs × 2 días × 26 releases/año = 156 días-persona/año
Suite automatizada:     30 min de ejecución × 26 releases = 13 horas/año
Inversión inicial:      ~5 días para construir la suite

ROI en el primer año:   (156 días - 5 días de inversión - 2 días de mantenimiento) = 149 días ahorrados
```

**Métricas para demostrar valor:**

| Métrica | Antes | Después (proyección) |
|---------|-------|---------------------|
| Tiempo de regresión por release | 2 días | 30 min |
| Bugs encontrados en producción | X | X - Y% |
| Tiempo de feedback en PR | 1 día (manual) | 5 min (CI) |
| Cobertura de casos de prueba | limitada por tiempo | 100% de lo definido |

**El argumento más fuerte**: los tests manuales no escalan. Con automatización, agregar un nuevo módulo cuesta 1 día de trabajo que se amortiza en el segundo release. Sin ella, cuesta 2 días de regresión cada dos semanas para siempre.

---

## GoRest Token Setup

1. Crear cuenta en [gorest.co.in](https://gorest.co.in)
2. Ir a My Account → Access Tokens → Generate Token
3. Copiar el token en `.env`:
   ```
   GOREST_TOKEN=tu_token_aqui
   ```
4. Para CI: agregar como GitHub Secret → `GOREST_TOKEN`
