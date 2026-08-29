# Full‑Stack Practice Plan — "Guestbook"

A deliberately small full‑stack app you can build in a day or two the first time,
then rebuild from muscle memory in ~2 hours. It exercises the core of the
environment described in your interview, minus the parts you chose to defer.

---

## 1. What we're building

**Guestbook**: a public web page with one form — **Name**, **Message**, **Passcode**.

- If the passcode matches a shared secret the backend knows, the message is
  stored and shown in a list below the form.
- If it doesn't match, the submission is rejected with a clear error.

That's it. The point is not the feature — it's having every layer real and wired:
Angular talking to a Spring Boot REST API talking to PostgreSQL, all reproducible
with Docker.

### Chosen stack (from your notes)

| Layer        | Technology                                   | Deferred for later |
|--------------|----------------------------------------------|--------------------|
| Frontend     | Angular (latest, standalone components)      | AngularJS→Angular migration drill |
| Backend      | Java 21 + Spring Boot 3.x, built with Maven  | Extra Java APIs, Python API, Go services |
| Database     | PostgreSQL 16                                | MySQL / SQL Server, MongoDB |
| Packaging    | Docker + Docker Compose (all 3 services)     | CI/CD pipeline |
| Runtime env  | WSL Ubuntu                                   | Direct Linux/SSH admin, shell scripting |

### Architecture

```
Browser
  │  http://localhost:8080
  ▼
┌─────────────┐   /api/*  proxy    ┌──────────────┐   JDBC    ┌────────────┐
│  nginx      │ ────────────────▶ │ Spring Boot  │ ───────▶ │ PostgreSQL │
│  (Angular   │                    │  REST API    │          │            │
│   static)   │ ◀──────────────── │  :8081       │ ◀─────── │  :5432     │
└─────────────┘                    └──────────────┘          └────────────┘
        all three run as containers via docker-compose.full.yml
```

### API contract

| Method | Path            | Body / Auth                              | Success | Failure |
|--------|-----------------|------------------------------------------|---------|---------|
| POST   | `/api/messages` | `{ name, message, passcode }`            | 201 + created record | 403 if passcode wrong, 400 if fields blank |
| GET    | `/api/messages` | none (open for the demo)                 | 200 + list (newest first) | — |

The passcode is **never stored** with the message and is checked server‑side only.
The backend reads the valid value from `APP_SUBMISSION_PASSCODE` (env var / config),
which mirrors how real API keys and shared secrets are handled.

### Data model

`messages` table:

| column       | type                       | notes                    |
|--------------|----------------------------|--------------------------|
| `id`         | BIGINT, PK, generated      |                          |
| `name`       | VARCHAR(100), not null     |                          |
| `body`       | VARCHAR(2000), not null    | the message text         |
| `created_at` | TIMESTAMPTZ, not null      | set by backend on insert |

Schema is created by Hibernate `ddl-auto` for the first build; the guide's
"level‑up" notes show swapping to Flyway migrations later.

---

## 2. Repository layout

```
fullstack-practice/
├── PLAN.md                      ← this file
├── BUILD_GUIDE.md               ← the step-by-step (written next)
├── RUNBOOK.md                   ← your condensed rebuild checklist (you maintain it)
├── docker-compose.yml           ← dev: PostgreSQL only
├── docker-compose.full.yml      ← prod-like: db + backend + frontend
├── .env.example                 ← passcode + db creds template
├── backend/
│   ├── pom.xml
│   ├── Dockerfile               ← multi-stage: Maven build → JRE
│   ├── src/main/java/com/example/guestbook/
│   │   ├── GuestbookApplication.java
│   │   ├── message/
│   │   │   ├── Message.java             (@Entity)
│   │   │   ├── MessageRepository.java   (JpaRepository)
│   │   │   ├── MessageController.java   (@RestController)
│   │   │   ├── MessageService.java      (passcode check + persistence)
│   │   │   ├── CreateMessageRequest.java (DTO in)
│   │   │   └── MessageResponse.java      (DTO out)
│   │   ├── config/
│   │   │   ├── AppProperties.java       (@ConfigurationProperties "app")
│   │   │   └── WebConfig.java           (CORS for dev)
│   │   └── error/
│   │       └── ApiExceptionHandler.java (@RestControllerAdvice)
│   └── src/main/resources/
│       ├── application.yml
│       └── application-docker.yml
└── frontend/
    ├── package.json
    ├── angular.json
    ├── Dockerfile               ← multi-stage: node build → nginx
    ├── nginx.conf               ← serves static + proxies /api to backend
    ├── proxy.conf.json          ← dev-only: ng serve → localhost:8081
    └── src/app/
        ├── app.config.ts        (provideHttpClient)
        ├── app.component.*       (shell)
        ├── guestbook/
        │   ├── guestbook.component.ts/html/css  (form + list)
        │   └── message.model.ts
        └── core/
            └── message.service.ts  (HttpClient calls)
```

---

## 3. Prerequisites (WSL Ubuntu) — first time only

Run these inside the Ubuntu shell. The guide will spell each one out with
verification commands; this is the shopping list.

1. **Docker Desktop for Windows** with WSL2 integration enabled for the Ubuntu
   distro. Verify in Ubuntu: `docker run --rm hello-world`.
2. **SDKMAN!** → install **Java 21** (Temurin) and **Maven**.
   Verify: `java -version`, `mvn -version`.
3. **nvm** → install **Node 22 LTS** (includes npm).
   Verify: `node -v`, `npm -v`.
4. **Angular CLI**: `npm install -g @angular/cli`. Verify: `ng version`.
5. **VS Code** with the **WSL** extension; open the folder via
   `code \\wsl.localhost\Ubuntu\home\user\workspace\fullstack-practice`
   (or `code .` from inside WSL).
6. Optional but recommended: `psql` client (`sudo apt install postgresql-client`)
   and `curl` / `http` for hitting the API.

Time: **45–90 min** the first time, near zero afterward.

---

## 4. Build phases

Each phase ends with something you can verify. Times are *focused* work:
first‑pass estimate → practiced estimate.

| # | Phase | Outcome / verification | First pass | Practiced |
|---|-------|------------------------|-----------|-----------|
| 0 | Prereqs (section 3) | All `--version` checks pass; `hello-world` runs | 60 min | 0 |
| 1 | **Project skeleton + Postgres** — create folders, `docker-compose.yml` (Postgres only), `.env` | `docker compose up -d` → `psql` connects to empty DB | 20 min | 5 min |
| 2 | **Backend scaffold** — generate from start.spring.io (Web, JPA, PostgreSQL driver, Validation, Actuator, Lombok optional); open in IDE; `application.yml` points at the Docker DB | `mvn spring-boot:run` starts on :8081; `/actuator/health` = UP | 45 min | 10 min |
| 3 | **Backend domain** — `Message` entity, repository, DTOs, `AppProperties` for the passcode, `MessageService` (validate passcode → save), `MessageController` (POST + GET), `ApiExceptionHandler`, dev CORS | app restarts clean; `messages` table auto‑created | 90 min | 25 min |
| 4 | **Backend verification** — hit it with curl: good passcode → 201, bad → 403, blank field → 400, GET lists rows | all four behave; rows visible in `psql` | 20 min | 5 min |
| 5 | **Frontend scaffold** — `ng new frontend` (routing optional, CSS); add `provideHttpClient`; `proxy.conf.json` → `:8081`; `ng serve` | default app loads at :4200 | 30 min | 5 min |
| 6 | **Frontend feature** — `message.model.ts`, `message.service.ts` (GET + POST), `guestbook.component` with a reactive form (name, message, passcode), submit handler, success/error message, list of existing messages | component renders; form validates required fields client‑side | 90 min | 25 min |
| 7 | **End‑to‑end (dev mode)** — Postgres in Docker, backend via `spring-boot:run`, frontend via `ng serve`; submit through the browser | good passcode adds to list; wrong passcode shows error; refresh persists | 25 min | 10 min |
| 8 | **Dockerize backend** — multi‑stage `backend/Dockerfile` (Maven cache layer → build jar → slim JRE runtime); `application-docker.yml` uses service hostname `db`; add backend service to `docker-compose.full.yml` | `docker compose -f docker-compose.full.yml up --build backend db` → health UP | 45 min | 15 min |
| 9 | **Dockerize frontend** — multi‑stage `frontend/Dockerfile` (node build → nginx static); `nginx.conf` serves SPA and proxies `/api` to `backend:8081`; add frontend service to compose | container serves the page on :8080 | 45 min | 15 min |
| 10 | **Full stack via Compose** — `docker compose -f docker-compose.full.yml up --build` from cold; test the whole flow at `http://localhost:8080` | fresh clone → one command → working app | 30 min | 10 min |
| 11 | **Write your RUNBOOK.md** — distill what you did into a terse checklist; note every place you fumbled | a checklist you trust | 30 min | (this is the practice) |

**First‑pass total: ~8–9 hours focused → comfortably 1–2 calendar days.**
**Practiced target: ~2–2.5 hours.**

---

## 5. The practiced rebuild sequence (goal state)

Once RUNBOOK.md exists, a rebuild is roughly:

```bash
# 1. skeleton
mkdir -p fullstack-practice && cd $_
# create docker-compose.yml (postgres), .env
docker compose up -d db

# 2. backend — download a pre-filled start.spring.io zip via curl, unzip to backend/
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,postgresql,validation,actuator \
  -d type=maven-project -d javaVersion=21 -d bootVersion=3.3.5 \
  -d groupId=com.example -d artifactId=guestbook -d name=guestbook \
  -d packageName=com.example.guestbook -o backend.zip
unzip backend.zip -d backend && rm backend.zip
# paste in the message/ config/ error/ packages from RUNBOOK snippets
# paste application.yml
mvn -f backend/pom.xml spring-boot:run   # verify with curl

# 3. frontend
ng new frontend --style=css --routing=false --ssr=false
# paste guestbook component, message.service.ts, proxy.conf.json, app.config.ts
cd frontend && ng serve --proxy-config proxy.conf.json   # verify in browser

# 4. dockerize
# paste backend/Dockerfile, frontend/Dockerfile, nginx.conf, docker-compose.full.yml
docker compose -f docker-compose.full.yml up --build
```

The reason it collapses to hours: phases 3 and 6 (the real work) become
copy‑paste‑adjust from your own snippets, and phase 0 is already done.

---

## 6. Practice loop

1. **Build 1** — follow BUILD_GUIDE.md exactly. Don't optimize. Note friction.
2. **Build 2** — 2–3 days later, from RUNBOOK.md only, guide as fallback.
   Time it. Fix RUNBOOK wherever you reached for the guide.
3. **Build 3** — from memory + RUNBOOK. Target under 3 hours.
4. **Then extend** — pick ONE deferred item and add it as a new phase
   (see section 7). Rebuild including that piece next round.

Keep each build in a throwaway folder (`~/practice/guestbook-01`, `-02`, …) so
you always start from nothing.

---

## 7. Where the deferred technologies plug in later

Described here so the architecture already has a slot for each; **not built now.**

| Later tech | Where it attaches | Rough effort |
|------------|-------------------|--------------|
| **Flyway/Liquibase migrations** | replace `ddl-auto` in backend; `db/migration/*.sql` | 1–2 h |
| **Automated tests** | backend: `@DataJpaTest` for repo, `@WebMvcTest` for controller, Testcontainers for a real PG in CI; frontend: one Jasmine spec for the service | 2–3 h |
| **CI/CD** | GitHub Actions: build+test backend, build frontend, build both images, `docker compose config` smoke test. The Dockerfiles from phases 8–9 are the handoff point to the devops team's world | 2–4 h |
| **A second backend language (Go or Python)** | stand up a tiny second service (e.g. `/api/stats` message counts) behind the same nginx proxy at `/api2/*`; teaches multi‑service routing and polyglot repos | 3–5 h each |
| **Java "other APIs"** | add endpoints/modules to the existing Spring app, or split into a multi‑module Maven build | varies |
| **MySQL / SQL Server** | swap the JDBC driver + `docker-compose` image + dialect; good exercise in what's portable vs not | 1–2 h |
| **MongoDB** | add `spring-boot-starter-data-mongodb` and a second repository for an audit/log collection alongside the relational data | 2–3 h |
| **AngularJS → Angular migration** | separate drill: take a small AngularJS app and port it component‑by‑component; unrelated to this codebase | separate project |
| **Shell scripting / Linux+SSH** | write `scripts/dev-up.sh`, `scripts/reset-db.sh`; practice deploying the compose stack to a remote VM over SSH | 2–4 h |
| **PowerShell** | mirror the shell scripts as `.ps1` for the Windows side | 1–2 h |

---

## 8. Key decisions locked in

- **Deliverable:** written step‑by‑step guide (BUILD_GUIDE.md). No pre‑built repo
  is handed to you — you build it by following the guide, which is what makes the
  practice work.
- **DB:** PostgreSQL via Docker Compose (no system install).
- **Passcode:** single shared secret in backend config (`APP_SUBMISSION_PASSCODE`),
  validated server‑side, never persisted. No user accounts, no Spring Security.
- **Environment:** everything inside WSL Ubuntu; edit via VS Code + WSL extension.
- **Scope:** core three layers wired end to end **plus** Dockerfiles for backend
  and frontend and a single `docker compose up` that runs all three.
- **Not in this pass:** CI/CD, Go, extra languages, migrations, auth, tests,
  MongoDB, MySQL/SQL Server.

---

## 9. Next step

Confirm this plan (or adjust section 8), then I'll write **BUILD_GUIDE.md**:
every command, every file's full contents, and a verification check at the end of
each of the 11 phases.
```
