# RUNBOOK — first build progress tracker

Checklist mirror of `BUILD_GUIDE.md`. Tick items with `[x]`. The guide has the
actual commands/file contents — this file is just "where am I + what did I learn".

Legend: `[ ]` todo · `[x]` done · `[~]` done with a caveat (see notes)

---

## Phase 0 — Prerequisites

### 0.0 Base packages
- [x] `sudo apt update && sudo apt install -y curl zip unzip`

**Notes:**
>

### 0.1 Docker Desktop
- [x] 1. Docker Desktop for Windows installed
- [x] 2. WSL integration enabled for Ubuntu
- [x] 3a. `docker run --rm hello-world` succeeds
- [x] 3b. `docker compose version` succeeds

**Notes:**
> hello-world ran fine (twice). `docker compose version` -> v5.4.0. Done.

### 0.2 Java 21 + Maven via SDKMAN
- [x] a. `curl -s "https://get.sdkman.io" | bash`
- [x] b. `source "$HOME/.sdkman/bin/sdkman-init.sh"`
- [x] c. `sdk list java | grep -i tem` (find current 21.x Temurin id)
- [x] d. `sdk install java 21.0.x-tem`
- [x] e. `sdk install maven`
- [x] f. `java -version` → 21.x
- [x] g. `mvn -version` → Maven 3.9.x on Java 21
- [x] h. open a fresh shell, re-run f & g
- [x] i. `which java && which mvn` → both under `~/.sdkman/...` (not `/mnt/c/...` or `/usr/lib/jvm`)

**Notes:**
> - curl worked only after installing zip/unzip in Ubuntu.
> - `source`-ing the init path worked.
> - `sdk list java` showed the versions; installs reported:
>   "Setting java 21.0.5-tem as default." / "Setting maven 3.9.16 as default."
>
> - GOTCHA: right after install, `java -version` still showed **25.0.4** and
>   `mvn -version` showed Maven **3.9.14 from `/mnt/c/Program Files/Maven`** (the
>   Windows install leaking onto the WSL PATH) running on `/usr/lib/jvm/java-25-openjdk`.
>   Cause: SDKMAN's dirs weren't on the current shell's `$PATH` yet.
>   Fix: `source "$HOME/.sdkman/bin/sdkman-init.sh"` puts SDKMAN's java/maven
>   earlier on `$PATH`. After that (and after opening a new WSL shell) `java` and
>   `mvn` resolved to the SDKMAN-managed Java 21.0.5 / Maven 3.9.16.
> - TODO: run step (i) to confirm the Windows Maven / java-25 aren't shadowing
>   anything in new shells.

### 0.3 Node 22 + Angular CLI via nvm
- [x] a. `curl -o- .../nvm/v0.40.1/install.sh | bash`
- [x] b. close and reopen the shell
- [x] c. `nvm install 22`
- [x] d. `nvm alias default 22`
- [x] e. `node -v` → v22.x
- [x] f. `npm -v`
- [x] g. `npm install -g @angular/cli`
- [x] h. `ng version`

**Notes:**
>   Worked first try. Very straight forward.

### 0.4 Helpers
- [x] `curl` present (from 0.0); `psql` client optional (`sudo apt install postgresql-client`)

**Notes:**
>   Done. Not sure what this does, but I'm sure it will be helpful later for SQL

### 0.5 Editor
- [x] `code .` from the project folder opens VS Code attached to WSL
- [x] install "Extension Pack for Java" + "Angular Language Service"

**Notes:**
>   Java Extension was already installed. Added the Angular Language Service.

### ✅ Verify Phase 0
- [ ] `docker run --rm hello-world && java -version && mvn -version && node -v && ng version` — all run

**Notes:**
>

---

## Phase 1 — Project skeleton + PostgreSQL

### 1.1 Folders
- [ ] `mkdir -p ~/workspace/fullstack-practice` then `mkdir backend frontend`

### 1.2 `docker-compose.yml` (Postgres only)
- [ ] created with `postgres:16`, db/user/pass = `guestbook`, port 5432, volume, healthcheck

### 1.3 `.env`
- [ ] `.env.example` created (`APP_SUBMISSION_PASSCODE=let-me-in`)
- [ ] `cp .env.example .env`

### 1.4 `.gitignore`
- [ ] created

### 1.5 Start the database
- [ ] `docker compose up -d`
- [ ] `docker compose ps` shows `db` healthy

### ✅ Verify Phase 1
- [ ] `docker compose exec db psql -U guestbook -d guestbook -c '\dt'` → "Did not find any relations."

**Notes:**
>

---

## Phase 2 — Spring Boot backend scaffold

### 2.1 Generate
- [ ] `curl https://start.spring.io/starter.zip ...` (web, data-jpa, postgresql, validation, actuator)
- [ ] unzip into `backend/` and flatten the inner folder
- [ ] `ls backend` shows `pom.xml`, `src`, `mvnw`

### 2.2 `application.yml`
- [ ] delete `application.properties`, create `application.yml` (port 8081, datasource localhost, ddl-auto update, `app.submission-passcode`)

### 2.3 `application-docker.yml`
- [ ] created (datasource host = `db`)

### 2.4 First run
- [ ] `cd backend && ./mvnw spring-boot:run` → `Started GuestbookApplication`

### ✅ Verify Phase 2
- [ ] `curl -s localhost:8081/actuator/health` → `{"status":"UP"}`

**Notes:**
>

---

## Phase 3 — Backend domain

Create each file (full contents in guide §3):
- [ ] 3.1 `GuestbookApplication.java` — add `@ConfigurationPropertiesScan`
- [ ] 3.2 `config/AppProperties.java`
- [ ] 3.3 `config/WebConfig.java` (dev CORS)
- [ ] 3.4 `message/Message.java` (`@Entity`)
- [ ] 3.5 `message/MessageRepository.java`
- [ ] 3.6 `message/CreateMessageRequest.java` (validated DTO in)
- [ ] 3.7 `message/MessageResponse.java` (DTO out — no passcode)
- [ ] 3.8 `message/InvalidPasscodeException.java`
- [ ] 3.9 `message/MessageService.java` (passcode check + save)
- [ ] 3.10 `message/MessageController.java` (GET + POST)
- [ ] 3.11 `error/ApiExceptionHandler.java`
- [ ] 3.12 `./mvnw spring-boot:run` — log shows `create table messages ...`

### ✅ Verify Phase 3
- [ ] `docker compose exec db psql -U guestbook -d guestbook -c '\d messages'` → columns `id, name, body, created_at`

**Notes:**
>

---

## Phase 4 — Backend verification with curl

(backend running + `docker compose up -d`)
- [ ] 4.1 valid POST → `201`, body has `id` + `createdAt`, no `passcode`
- [ ] 4.2 wrong passcode → `403`
- [ ] 4.3 blank name/message → `400`
- [ ] 4.4 `GET /api/messages` → `200`, newest first

### ✅ Verify Phase 4
- [ ] `psql ... select id, name, body from messages;` → one row (Ada)

**Notes:**
>

---

## Phase 5 — Angular frontend scaffold

### 5.1 Generate
- [ ] `ng new frontend --style=css --ssr=false` (accept other defaults)

### 5.2 `src/app/app.config.ts`
- [ ] add `provideHttpClient()` to `providers` (leave the rest untouched)

### 5.3 Dev proxy
- [ ] create `frontend/proxy.conf.json` → target `http://localhost:8081`
- [ ] add `"proxyConfig": "proxy.conf.json"` to `angular.json` → serve → options

### 5.4 Run
- [ ] `ng serve` → http://localhost:4200 loads the starter page

### ✅ Verify Phase 5
- [ ] starter page loads at :4200, no console errors

**Notes:**
>

---

## Phase 6 — The guestbook feature

Create each file (full contents in guide §6):
- [ ] 6.1 `src/app/core/message.model.ts`
- [ ] 6.2 `src/app/core/message.service.ts`
- [ ] 6.3 `src/app/guestbook/guestbook.component.ts`
- [ ] 6.4 `src/app/guestbook/guestbook.component.html`
- [ ] 6.5 `src/app/guestbook/guestbook.component.css`
- [ ] 6.6 mount `<app-guestbook />` in the root component (`app.component.ts` **or** `app.ts`)
- [ ] 6.7 `ng serve`

### ✅ Verify Phase 6
- [ ] :4200 shows the form + empty "Messages" section, no console errors

**Notes:**
>

---

## Phase 7 — End-to-end in dev mode

### 7.1 Three terminals
- [ ] terminal 1: `docker compose up -d` (db)
- [ ] terminal 2: `cd backend && ./mvnw spring-boot:run`
- [ ] terminal 3: `cd frontend && ng serve`

### 7.2 Browser checks (http://localhost:4200)
- [ ] valid submit (passcode `let-me-in`) → green success + row appears
- [ ] passcode `nope` → red "Wrong passcode."
- [ ] empty name → blocked client-side (and server `400` if forced)
- [ ] reload page → messages persist

### ✅ Verify Phase 7
- [ ] `psql ... select name, body, created_at from messages order by created_at desc;` → your submissions
- [ ] **App works end to end.**

**Notes:**
>

---

## Phase 8 — Dockerize the backend

- [ ] 8.1 `backend/Dockerfile` (multi-stage: maven build → jre-alpine)
- [ ] 8.2 `backend/.dockerignore`
- [ ] 8.3 `docker build -t guestbook-backend .`
- [ ] 8.3 `docker run ... --network fullstack-practice_default -e SPRING_PROFILES_ACTIVE=docker ...` (confirm network name with `docker network ls`)

### ✅ Verify Phase 8
- [ ] `curl -s localhost:8081/actuator/health` → UP
- [ ] `curl -s localhost:8081/api/messages` → earlier rows

**Notes:**
>

---

## Phase 9 — Dockerize the frontend + nginx

- [ ] 9.1 `npm run build`; `ls dist/frontend` → has `browser/` (else adjust Dockerfile COPY path)
- [ ] 9.2 `frontend/Dockerfile` (multi-stage: node build → nginx)
- [ ] 9.3 `frontend/nginx.conf` (`/api/` → `backend:8081`, SPA fallback)
- [ ] 9.4 `frontend/.dockerignore`

### ✅ Verify Phase 9
- [ ] `docker build -t guestbook-frontend frontend/` completes

**Notes:**
>

---

## Phase 10 — Full stack via Compose

- [ ] 10.1 `docker-compose.full.yml` (db + backend + frontend, healthchecks, `8080:80`)
- [ ] 10.2 `docker compose down` (stop dev db), then `docker compose -f docker-compose.full.yml up --build`
- [ ] 10.3 http://localhost:8080 — repeat the Phase 7 browser checks
- [ ] 10.3 `curl -s localhost:8080/api/messages`
- [ ] 10.4 shutdown: `... down` (keep data) / `... down -v` (wipe volume)

### ✅ Verify Phase 10
- [ ] cold `up --build` from clean state → working guestbook at :8080, no manual steps
- [ ] **Done.**

**Notes:**
>

---

## Phase 11 — Distil the rebuild runbook

This file was the first-pass progress tracker. For build 2, write a *terse*
rebuild checklist in a separate file (e.g. `RUNBOOK-rebuild.md`) — the 4-block
skeleton in `PLAN.md` §5 / `BUILD_GUIDE.md` §11 — plus a `snippets/` folder with
the actual file contents so it's copy-paste-adjust.

- [ ] `RUNBOOK-rebuild.md` written
- [ ] `snippets/` folder populated

**Notes:**
>

---

## Running log / open questions

> Anything you want to come back to, mistakes to avoid next time, things that
> didn't match the guide:
>
> - (0.2) Windows Maven + java-25 on PATH shadowed SDKMAN until `sdkman-init.sh`
>   was sourced. Watch for `/mnt/c/...` on `$PATH` in general.
>
>
