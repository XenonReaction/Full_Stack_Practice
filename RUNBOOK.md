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
- [x] `docker run --rm hello-world && java -version && mvn -version && node -v && ng version` — all run

**Notes:**
>

---

## Phase 1 — Project skeleton + PostgreSQL

### 1.1 Folders
- [x] `mkdir -p ~/workspace/fullstack-practice` then `mkdir backend frontend`

**Notes:**
>   this is straightforward. ubuntu commands

### 1.2 `docker-compose.yml` (Postgres only)
- [x] created with `postgres:16`, db/user/pass = `guestbook`, port 5432, volume, healthcheck

**Notes:**
>   I don't really get this. I think it is a guide for docker that will help create the docker image

### 1.3 `.env`
- [x] `.env.example` created (`APP_SUBMISSION_PASSCODE=let-me-in`)
- [x] `cp .env.example .env`

**Notes:**
>   This was confusing.  I didn't get I was creating a hidden file that needed a line added to it.  'env.example' needed to be made and have the line above saved to it.  The second line, I don't get what that does either.  Ohh.... it copied '.env.example' and made '.env'.  So '.env' is now the same as the other file.  I have no clue why we needed to do that.

### 1.4 `.gitignore`
- [x] created

**Notes:**
>   This one is easy.  I've made and used .gitignore files before.  I really don't know what is standard to add to them.  I've always just followed suggestions and included files with passwords or secure information.

### 1.5 Start the database
- [x] `docker compose up -d`
- [x] `docker compose ps` shows `db` healthy

**Notes:**
>   Okay... this one I think creates and opens the docker image, and then shows that the docker image is running.  I saw a popup that asked for access to docker.desktop, and docker.desktop now shows something running.  The command second command also shows that it is up and running in the terminal window.

### ✅ Verify Phase 1
- [x] `docker compose exec db psql -U guestbook -d guestbook -c '\dt'` → "Did not find any relations."

**Notes:**
>   Didn't really get what this was doing, but asked ChatGPT, and it basically looks for the running docker container and runs a postgresql command in it asking it to list the existing tables in the database.  Since there are none, it returns "Did not find any relations."

---

## Phase 2 — Spring Boot backend scaffold

### 2.1 Generate
- [x] `curl https://start.spring.io/starter.zip ...` (web, data-jpa, postgresql, validation, actuator)
- [x] unzip into `backend/` and flatten the inner folder
- [x] `ls backend` shows `pom.xml`, `src`, `mvnw`

**Notes:**
>   This was just a copy and paste step from the guide.  Apparently, most people access the Spring Initializr in the browser, or have it integrated into the IDE with IntelliJ.  The copy and paste is good for making sure the tutorial is followed correctly.

### 2.2 `application.yml`
- [x] delete `application.properties`, create `application.yml` (port 8081, datasource localhost, ddl-auto update, `app.submission-passcode`)

**Notes:**
>   'application.properties could have been used, but the structure of the data would have been different.  the guide preffered the .yml file because it uses indentation to define the variables instead of a series of words seperated by '.'s 

### 2.3 `application-docker.yml`
- [x] created (datasource host = `db`)

**Notes:**
>   This part isn't important now, and I don't think we will be able to even verify if it's been done correctly until Phase 8.  It has to do with docker configuration information.

### 2.4 First run
- [x] `cd backend && ./mvnw spring-boot:run` → `Started GuestbookApplication`

**Notes:**
>   First attempt resulted in "build failure".  Second attempt, ran the command with "-e" to see the stack trace and didn't understand how to find the relevant information.  Third attempt, ran the command with "-X" to see the DEBUG tools.  Went to a suggested website, and it has to do with a plugin for Maven problem.  Something in the POM is not configured correctly... maybe?  Asked Claude, and figured out it was because my docker container for SQL wasn't up.  Opened up docker.desktop, and ran it and springboot starts right up now.  I also learned I can check if docker is running in the command line with "docker ps" or "docker compose ps".  I can also start the docker file with "docker compose up", but then I have to exit the docker "interaction area" (I don't know what it is called when the command line is taken over by some program like nano, vim, or even a git command that reads logs).

### ✅ Verify Phase 2
- [x] `curl -s localhost:8081/actuator/health` → `{"status":"UP"}`

**Notes:**
>   tried this command, and got no output.  Changed "8081" to "5432", and still got no output.  Oh.... I was running the command in the same terminal window after i ran and closed the Spring-boot instance.  I needed to run Spring-boot in one terminal, open a second, and run the command.  Did it and got the desired output.  "{"groups":["liveness","readiness"],"status":"UP"}"

---

## Phase 3 — Backend domain

Create each file (full contents in guide §3):
- [x] 3.1 `GuestbookApplication.java` — add `@ConfigurationPropertiesScan`

**Notes:**
>   All I had to do was add one line of code that was an import statement.  "
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;"  I had no clue why, so I asked ChatGPT.  It tells Spring-Boot "Search my application's packages for classes that are designed to receive configuration properties."

- [x] 3.2 `config/AppProperties.java`

**Notes:**
>   Created a file.  The package statement required is different than the package statement for 'GuestbookApplication.java'.  Don't know why.  After research, this file is important because we want to create a website that allows submissions with a know password.  The way we are going to do this is with the ConfigurationProperties annotation built into (maybe...?) annotation in Spring.  We needed to do step 3.1 so on start, the application would look for instances of the annoation and allow their use.

- [x] 3.3 `config/WebConfig.java` (dev CORS)

**Notes:**
>   This file allows request from the Angular front end we are going to create.  It also only allows "GET" and "POST" requests for now.

- [x] 3.4 `message/Message.java` (`@Entity`)

**Notes:**
>   This file is important because we need a class that emulates the structure of the SQL schema created for messages table and row enteries.  It needs to mimc that structure so we can easily and cleanly pull data from the database, and insert data into it without error.

- [x] 3.5 `message/MessageRepository.java`

**Notes:**
>   This part is freaking cool.  This interface allows Spring-Boot to make all the crap that we would normally need to write ourselves.  Since the interface extends "JpaRepository" with "Message" and "Long", it's going to make all of the the normal repository functions we need without us having to declare them.  "save()", "findById()", "findAll()", and "delete()" we all get for free.  We just added a ne function "findAllByOrderByCreatedAtDesc()" because that's not standard and we want to use that later for something."

- [x] 3.6 `message/CreateMessageRequest.java` (validated DTO in)

**Notes:**
>   This file defines the structure of our message requests that will be sent to the backend.

- [x] 3.7 `message/MessageResponse.java` (DTO out — no passcode)

**Notes:**
>   This file helps convert the response from the database into a format easily readable and usable in Java

- [x] 3.8 `message/InvalidPasscodeException.java`

**Notes:**
>   This creates a custom exception so we can code how to handle incorrect passcodes.  It doesn't log or track anything right now, but that could be implemented later if we wanted to.

- [x] 3.9 `message/MessageService.java` (passcode check + save)

**Notes:**
>   Ohh... since this is very simplified project, we don't have separate folders for Controller, Service, and Repository layers.  This class is the Service layer for the Messages, and the MessageRepository layer didn't use @Repository like this file used @Service because we extended the JPA someting or other.  @Service, @Controller, and @Repository are the spring boot ways to build your 3 tier back-end structure.

- [x] 3.10 `message/MessageController.java` (GET + POST)

**Notes:**
>   We are only going to "GET" and "POST" so or @RestController only needs to handle these two http requests.

- [x] 3.11 `error/ApiExceptionHandler.java`

**Notes:**
>   Handling exceptions and such

- [x] 3.12 `./mvnw spring-boot:run` — log shows `create table messages ...`

**Notes:**
>   Couldn't get it to run for the longest time.  It had to do with the fact that the application wasn't recognizing the configuration files as beans on run.  All that was needed was an annotation above the app class "@ConfigurationPropertiesScan" so it could recognize the appConfiguration and create the beans.

### ✅ Verify Phase 3
- [x] `docker compose exec db psql -U guestbook -d guestbook -c '\d messages'` → columns `id, name, body, created_at`

**Notes:**
>   It printed output after running.  I had to run the backend in a different instance of vscode I opened in the terminal in the back-end folder.  Don't know if that was necessary.  I'll try running it while in the full app in vscode and see if that changes anything.  Still worked.  But the terminal options don't include wsl now. It's opening in bash instead.  I'll have to figure out if I can open it in wsl still or if that isn't an option anymore.

---

## Phase 4 — Backend verification with curl

(backend running + `docker compose up -d`)
- [x] 4.1 valid POST → `201`, body has `id` + `createdAt`, no `passcode`

**Notes:**
>   works

- [x] 4.2 wrong passcode → `403`

**Notes:**
>   works

- [x] 4.3 blank name/message → `400`

**Notes:**
>   works

- [x] 4.4 `GET /api/messages` → `200`, newest first

**Notes:**
>   works

### ✅ Verify Phase 4
- [x] `psql ... select id, name, body from messages;` → one row (Ada)

**Notes:**
>   This entire phase wouldn't be necessary with test driven development.  Should implement that in the future, but that isn't the focus of this project.

---

## Phase 5 — Angular frontend scaffold

### 5.1 Generate
- [x] `ng new frontend --style=css --ssr=false` (accept other defaults)

**Notes:**
>   Didn't work first time i tried the "ng new frontend" command.  There was some issue with the version of npm (10.9.8) that could accept null values, so Claude updated the version to 11.19.1, and the commands worked.

### 5.2 `src/app/app.config.ts`
- [x] add `provideHttpClient()` to `providers` (leave the rest untouched)

**Notes:**
>   This step is necessary for setting up how Angular creates HTTP requests. 'HttpClient' is the tool that makes the requests, but we need to set up the project, so the app has access to this tool.  This is done in 'app.config.ts' because this is where we tell Angular what providers to use.  The way 'HttpClient' will be used is through Angular's dependency injection system.  I'm pretty sure we will use the annotation '@Injectable' later to implement 'HttpClient', but we will find out.

### 5.3 Dev proxy
- [x] create `frontend/proxy.conf.json` → target `http://localhost:8081`
- [x] add `"proxyConfig": "proxy.conf.json"` to `angular.json` → serve → options

**Notes:**
>   This step has to do with CORS (cross-orgins) considerations.  This is a "during development" step that is necessary to have the front end and back end know what ports are being used, I think.  It seems like a lot of learning to use these tools in unison is about learing how to get them downloaded, checking the download is the correct version, testing the tool exists, testing the tool works, then setting up 9 other tools in the same fashion, then setting up all the specific pieces that are necessary to make sure the tools work in unison.  I done very minimal interaction with Angular, Spring-boot, docker, and SQL so far.  Most of the time is spent setting up and confirming each layer works together.

### 5.4 Run
- [x] `ng serve` → http://localhost:4200 loads the starter page

**Notes:**
>   This is a basic command to see the front end.  It works.

### ✅ Verify Phase 5
- [x] starter page loads at :4200, no console errors

**Notes:**
>   Front-end loads. I also ran docker and the back-end, but I forgot I haven't done anything to wire up or connect the front-end and back-end.

---

## Phase 6 — The guestbook feature

Create each file (full contents in guide §6):
- [x] 6.1 `src/app/core/message.model.ts`

**Notes:**
>   I believe this is the structure necessary to track sending and receiving information about messages in typescript for angular.  Asked ChatGPT, and it said "These interfaces define the expected structure of message data that the Angular frontend sends to and receives from the Spring Boot backend."  Makes more sense.  

- [ ] 6.2 `src/app/core/message.service.ts`

**Notes:**
>   What we made in the last step was a typescript interface.  This step implements the type script interface for structuring sent and received messages on the front-end .... as a service... ?  We want MessageService to be @Injectable because we are going to use it a component or some other structure later.  It needs certain functions in order to be useful, and one of the abilities it will need are HTTP request that it can do because of 'HttpClient'.  ChatGPT said to replace "implements the interfaces" with "uses the interfaces to type the data it sends and receives".

- [x] 6.3 `src/app/guestbook/guestbook.component.ts`

**Notes:**
>   This is a component. It will use everything we have built so far to render something on the page for the user and then make calls to the back end through 'message.service'.

- [x] 6.4 `src/app/guestbook/guestbook.component.html`

**Notes:**
>   Oh yeah! I remember doing this.  When I was following an AI's prompts for how to create stuff in angular, it was having me manually create and implement these pieces as well.  There is a system built into Angular to create components with commands through the command line.  I'll need to do that next time through this project.

- [x] 6.5 `src/app/guestbook/guestbook.component.css`

**Notes:**
>   This is the .css (Cascading Style Sheet) file.  If I used the create component command in angular all three of the last files would have been created and named and populated with some code... I think?  It also can create a testing file if I'm not mistaken.  The next pass of this project will definitely need to include using the command line to create components and the use of angular unit testing.

- [x] 6.6 mount `<app-guestbook />` in the root component (`app.component.ts` **or** `app.ts`)

**Notes:**
>   Literally started to ask Claude why the directions made no sense because there was no 'app.component.ts' in the 'app' folder.  But all I had to do was keep reading and see that it also might be called 'app.ts'.  It was and is in the 'app' folder.

- [x] 6.7 `ng serve`

**Notes:**
>   Freaking works. I have no clue what the passcode is, so I can't actually test the implementation.  But the front end loads and displays the guestbook component.

### ✅ Verify Phase 6
- [x] :4200 shows the form + empty "Messages" section, no console errors

**Notes:**
>   Verified!

---

## Phase 7 — End-to-end in dev mode

### 7.1 Three terminals
- [x] terminal 1: `docker compose up -d` (db)
- [x] terminal 2: `cd backend && ./mvnw spring-boot:run`
- [x] terminal 3: `cd frontend && ng serve`

**Notes:**
>   These are the same steps from the end of Phase 6. They still work.

### 7.2 Browser checks (http://localhost:4200)
- [x] valid submit (passcode `let-me-in`) → green success + row appears
- [x] passcode `nope` → red "Wrong passcode."
- [x] empty name → blocked client-side (and server `400` if forced)
- [x] reload page → messages persist

**Notes:**
>   Not sure about the empty name submission.  It doesn't do anything, even with the correct password.

### ✅ Verify Phase 7
- [x] `psql ... select name, body, created_at from messages order by created_at desc;` → your submissions
- [x] **App works end to end.**

**Notes:**
> Works as intended!

---

## Phase 8 — Dockerize the backend

- [x] 8.1 `backend/Dockerfile` (multi-stage: maven build → jre-alpine)

**Notes:**
>   This is the instructions for building the dockerized container for the backend.  This can be done with other tools, and the best tool is probablly to us Spring Boot Buildpacks.  This file was created manually, but the buildpacks are designed to make a production oriented container.

- [x] 8.2 `backend/.dockerignore`

**Notes:**
>   Get's rid of files that are unnecessary for the backend to run

- [x] 8.3 `docker build -t guestbook-backend .`

**Notes:**
>   I built it.

- [ ] 8.3 `docker run ... --network fullstack-practice_default -e SPRING_PROFILES_ACTIVE=docker ...` (confirm network name with `docker network ls`)

**Notes:**
>   didn't work on the first try because I needed to run "docker compose up -d" first.  I think if I run "docker compose up -d" it should spin up the database and the backend at the same time.

### ✅ Verify Phase 8
- [x] `curl -s localhost:8081/actuator/health` → UP
- [x] `curl -s localhost:8081/api/messages` → earlier rows

**Notes:**
>   Worked and didn't show anything after closing the instance of docker running.  I have to run that hug "docker run ..." command to get the backend and database up at the same time now.

---

## Phase 9 — Dockerize the frontend + nginx

- [ ] 9.1 `npm run build`; `ls dist/frontend` → has `browser/` (else adjust Dockerfile COPY path)

**Notes:**
>

- [ ] 9.2 `frontend/Dockerfile` (multi-stage: node build → nginx)

**Notes:**
>

- [ ] 9.3 `frontend/nginx.conf` (`/api/` → `backend:8081`, SPA fallback)

**Notes:**
>

- [ ] 9.4 `frontend/.dockerignore`

**Notes:**
>

### ✅ Verify Phase 9
- [ ] `docker build -t guestbook-frontend frontend/` completes

**Notes:**
>

---

## Phase 10 — Full stack via Compose

- [ ] 10.1 `docker-compose.full.yml` (db + backend + frontend, healthchecks, `8080:80`)

**Notes:**
>

- [ ] 10.2 `docker compose down` (stop dev db), then `docker compose -f docker-compose.full.yml up --build`

**Notes:**
>

- [ ] 10.3 http://localhost:8080 — repeat the Phase 7 browser checks

**Notes:**
>

- [ ] 10.3 `curl -s localhost:8080/api/messages`

**Notes:**
>

- [ ] 10.4 shutdown: `... down` (keep data) / `... down -v` (wipe volume)

**Notes:**
>

### ✅ Verify Phase 10
- [ ] cold `up --build` from clean state → working guestbook at :8080, no manual steps

**Notes:**
>

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
