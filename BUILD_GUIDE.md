# BUILD_GUIDE.md — Guestbook, from nothing to running

Follow this top to bottom the first time. Every command is meant to be run in the
**Ubuntu (WSL) shell** unless it says otherwise. Every file listed is given in
full — create it exactly, then adjust once you understand it.

At the end of each phase there is a **Verify** box. Do not move on until it passes.

- Working folder: `~/workspace/fullstack-practice` (same as `\\wsl.localhost\Ubuntu\home\user\workspace\fullstack-practice`)
- App name: `guestbook`
- Backend port: `8081` · Frontend dev port: `4200` · Full-stack port: `8080` · Postgres: `5432`
- Passcode (default): `let-me-in`

---

## Phase 0 — Prerequisites (first time only, ~60 min)

### 0.0 Base packages (fresh Ubuntu)

```bash
sudo apt update && sudo apt install -y curl zip unzip
```

`zip`/`unzip` are required by SDKMAN in 0.2 — without them its installer aborts.

### 0.1 Docker Desktop

1. Install **Docker Desktop for Windows** (Windows side).
2. Docker Desktop → **Settings → Resources → WSL Integration** → enable for **Ubuntu**. Apply & restart.
3. In the Ubuntu shell:

```bash
docker run --rm hello-world
docker compose version
```

Both must succeed.

### 0.2 Java 21 + Maven via SDKMAN

```bash
curl -s "https://get.sdkman.io" | bash          # downloads + runs the SDKMAN installer
source "$HOME/.sdkman/bin/sdkman-init.sh"

sdk list java | grep -i tem        # find the current 21.x Temurin id
sdk install java 21.0.5-tem        # use whatever id the line above showed
sdk install maven

java -version                       # -> openjdk version "21..."
mvn -version                        # -> Apache Maven 3.9.x, Java 21
```

Open a new shell afterward so `sdkman-init.sh` loads automatically (SDKMAN adds it
to `~/.bashrc`).

### 0.3 Node 22 + Angular CLI via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# close and reopen the shell
nvm install 22
nvm alias default 22
node -v                             # v22.x
npm -v

npm install -g @angular/cli
ng version                          # Angular CLI 1x/2x
```

### 0.4 Helpers

```bash
sudo apt update && sudo apt install -y curl
# psql client is handy but optional; we can also exec into the db container
```

### 0.5 Editor

From Ubuntu, in the project folder later: `code .` opens VS Code with the WSL
extension attached. Install the "Extension Pack for Java" and "Angular Language
Service" when prompted.

> **Verify Phase 0**
> ```bash
> docker run --rm hello-world && java -version && mvn -version && node -v && ng version
> ```
> All five run without "command not found".

---

## Phase 1 — Project skeleton + PostgreSQL (~20 min)

### 1.1 Folders

```bash
mkdir -p ~/workspace/fullstack-practice
cd ~/workspace/fullstack-practice
mkdir backend frontend
```

### 1.2 `docker-compose.yml` (dev — Postgres only)

Create `~/workspace/fullstack-practice/docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: guestbook
      POSTGRES_USER: guestbook
      POSTGRES_PASSWORD: guestbook
    ports:
      - "5432:5432"
    volumes:
      - guestbook_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U guestbook -d guestbook"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  guestbook_pgdata:
```

### 1.3 `.env.example` and `.env`

Create `.env.example`:

```bash
APP_SUBMISSION_PASSCODE=let-me-in
```

```bash
cp .env.example .env
```

### 1.4 `.gitignore` (optional but do it)

```gitignore
# java
backend/target/
# node
frontend/node_modules/
frontend/dist/
frontend/.angular/
# env
.env
# ide
.idea/
.vscode/
*.iml
```

### 1.5 Start the database

```bash
docker compose up -d
docker compose ps
```

> **Verify Phase 1**
> ```bash
> docker compose exec db psql -U guestbook -d guestbook -c '\dt'
> ```
> Output: `Did not find any relations.` (an empty database — correct).

---

## Phase 2 — Spring Boot backend scaffold (~45 min)

### 2.1 Generate the project

```bash
cd ~/workspace/fullstack-practice
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d javaVersion=21 \
  -d groupId=com.example \
  -d artifactId=guestbook \
  -d name=guestbook \
  -d packageName=com.example.guestbook \
  -d dependencies=web,data-jpa,postgresql,validation,actuator \
  -o backend.zip

rm -rf backend && unzip backend.zip -d backend && rm backend.zip
# the zip contains a top-level folder; flatten it:
shopt -s dotglob && mv backend/guestbook/* backend/ && rmdir backend/guestbook && shopt -u dotglob
ls backend           # pom.xml, src, mvnw, ...
```

> If `bootVersion` matters to you, add `-d bootVersion=3.3.5`. Otherwise you get
> the current stable release, which is fine — every snippet below is stable across
> Spring Boot 3.2–3.4.

### 2.2 `backend/src/main/resources/application.yml`

Delete `application.properties` and create `application.yml`:

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/guestbook
    username: guestbook
    password: guestbook
  jpa:
    hibernate:
      ddl-auto: update
    open-in-view: false
    show-sql: true
    properties:
      hibernate.format_sql: true

management:
  endpoints:
    web:
      exposure:
        include: health,info

app:
  submission-passcode: ${APP_SUBMISSION_PASSCODE:let-me-in}
```

### 2.3 `backend/src/main/resources/application-docker.yml`

Used only when `SPRING_PROFILES_ACTIVE=docker` (Phase 8). Points at the compose
service hostname `db` instead of `localhost`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/guestbook
    username: ${POSTGRES_USER:guestbook}
    password: ${POSTGRES_PASSWORD:guestbook}
```

### 2.4 First run

```bash
cd backend
./mvnw spring-boot:run
```

Wait for `Started GuestbookApplication`.

> **Verify Phase 2**
> ```bash
> curl -s localhost:8081/actuator/health
> ```
> Output: `{"status":"UP"}`. Stop the app with `Ctrl+C`.

---

## Phase 3 — Backend domain (~90 min)

All paths below are under `backend/src/main/java/com/example/guestbook/`.

### 3.1 Enable config properties — edit `GuestbookApplication.java`

```java
package com.example.guestbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class GuestbookApplication {
    public static void main(String[] args) {
        SpringApplication.run(GuestbookApplication.class, args);
    }
}
```

### 3.2 `config/AppProperties.java`

```java
package com.example.guestbook.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** Shared secret a submission must include to be accepted. */
    private String submissionPasscode;

    public String getSubmissionPasscode() {
        return submissionPasscode;
    }

    public void setSubmissionPasscode(String submissionPasscode) {
        this.submissionPasscode = submissionPasscode;
    }
}
```

### 3.3 `config/WebConfig.java` — dev CORS

Lets `ng serve` (port 4200) call the API directly during development. Harmless in
prod because the proxy makes requests same-origin.

```java
package com.example.guestbook.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST");
    }
}
```

### 3.4 `message/Message.java` — JPA entity

```java
package com.example.guestbook.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Message() {
        // for JPA
    }

    public Message(String name, String body, OffsetDateTime createdAt) {
        this.name = name;
        this.body = body;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBody() {
        return body;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
```

### 3.5 `message/MessageRepository.java`

```java
package com.example.guestbook.message;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findAllByOrderByCreatedAtDesc();
}
```

### 3.6 `message/CreateMessageRequest.java` — inbound DTO with validation

```java
package com.example.guestbook.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMessageRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 2000) String message,
        @NotBlank String passcode) {
}
```

### 3.7 `message/MessageResponse.java` — outbound DTO

Note: no passcode field — it never leaves the client on the way back.

```java
package com.example.guestbook.message;

import java.time.OffsetDateTime;

public record MessageResponse(Long id, String name, String message, OffsetDateTime createdAt) {

    static MessageResponse from(Message m) {
        return new MessageResponse(m.getId(), m.getName(), m.getBody(), m.getCreatedAt());
    }
}
```

### 3.8 `message/InvalidPasscodeException.java`

```java
package com.example.guestbook.message;

public class InvalidPasscodeException extends RuntimeException {

    public InvalidPasscodeException() {
        super("Invalid passcode");
    }
}
```

### 3.9 `message/MessageService.java`

```java
package com.example.guestbook.message;

import com.example.guestbook.config.AppProperties;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository repository;
    private final AppProperties appProperties;

    public MessageService(MessageRepository repository, AppProperties appProperties) {
        this.repository = repository;
        this.appProperties = appProperties;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> findAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse create(CreateMessageRequest request) {
        if (!appProperties.getSubmissionPasscode().equals(request.passcode())) {
            throw new InvalidPasscodeException();
        }
        Message saved = repository.save(
                new Message(request.name().trim(), request.message().trim(), OffsetDateTime.now()));
        return MessageResponse.from(saved);
    }
}
```

### 3.10 `message/MessageController.java`

```java
package com.example.guestbook.message;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService service;

    public MessageController(MessageService service) {
        this.service = service;
    }

    @GetMapping
    public List<MessageResponse> list() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse create(@Valid @RequestBody CreateMessageRequest request) {
        return service.create(request);
    }
}
```

### 3.11 `error/ApiExceptionHandler.java`

```java
package com.example.guestbook.error;

import com.example.guestbook.message.InvalidPasscodeException;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(InvalidPasscodeException.class)
    public ProblemDetail handlePasscode(InvalidPasscodeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }
}
```

### 3.12 Run again

```bash
cd backend
./mvnw spring-boot:run
```

Watch the log: Hibernate prints a `create table messages ...` statement.

> **Verify Phase 3**
> ```bash
> docker compose exec db psql -U guestbook -d guestbook -c '\d messages'
> ```
> Shows columns `id, name, body, created_at`. Leave the app running for Phase 4
> (or restart it there).

---

## Phase 4 — Backend verification with curl (~20 min)

With the backend running and `docker compose up -d` active:

```bash
# 1. valid submission -> 201 Created
curl -i -X POST localhost:8081/api/messages \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","message":"First entry","passcode":"let-me-in"}'

# 2. wrong passcode -> 403 Forbidden
curl -i -X POST localhost:8081/api/messages \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mallory","message":"sneaky","passcode":"wrong"}'

# 3. blank fields -> 400 Bad Request
curl -i -X POST localhost:8081/api/messages \
  -H 'Content-Type: application/json' \
  -d '{"name":"","message":"","passcode":"let-me-in"}'

# 4. list -> 200, newest first
curl -s localhost:8081/api/messages
```

> **Verify Phase 4**
> - #1 returns `HTTP/1.1 201` and a JSON body with an `id` and `createdAt`, no `passcode`.
> - #2 returns `403`.
> - #3 returns `400`.
> - #4 lists the "Ada" row only.
> ```bash
> docker compose exec db psql -U guestbook -d guestbook -c 'select id, name, body from messages;'
> ```
> One row. Stop the backend with `Ctrl+C`.

---

## Phase 5 — Angular frontend scaffold (~30 min)

### 5.1 Generate

```bash
cd ~/workspace/fullstack-practice
rm -rf frontend
ng new frontend --style=css --ssr=false
# Accept defaults for any other prompt (analytics: your choice).
cd frontend
```

### 5.2 Register HttpClient — `src/app/app.config.ts`

Open the file. Add `provideHttpClient()` to the `providers` array, keeping
everything the CLI generated:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
// ...other generated imports stay as-is

export const appConfig: ApplicationConfig = {
  providers: [
    // ...whatever the CLI generated, left untouched...
    provideHttpClient(),
  ],
};
```

### 5.3 Dev proxy — `frontend/proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false
  }
}
```

Wire it into `angular.json` so `ng serve` always uses it. Find
`projects → frontend → architect → serve → options` (it may be
`"builder": "@angular/build:dev-server"` or similar) and add:

```json
"options": {
  "proxyConfig": "proxy.conf.json"
}
```

### 5.4 Run

```bash
ng serve
```

Open http://localhost:4200 — the default Angular page.

> **Verify Phase 5**
> The starter page loads at :4200 with no console errors. Stop with `Ctrl+C`.

---

## Phase 6 — The guestbook feature (~90 min)

Paths are under `frontend/src/app/`.

### 6.1 `core/message.model.ts`

```typescript
export interface Message {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

export interface CreateMessage {
  name: string;
  message: string;
  passcode: string;
}
```

### 6.2 `core/message.service.ts`

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateMessage, Message } from './message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);
  private baseUrl = '/api/messages';

  list(): Observable<Message[]> {
    return this.http.get<Message[]>(this.baseUrl);
  }

  create(payload: CreateMessage): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, payload);
  }
}
```

### 6.3 `guestbook/guestbook.component.ts`

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Message } from '../core/message.model';
import { MessageService } from '../core/message.service';

@Component({
  selector: 'app-guestbook',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './guestbook.component.html',
  styleUrl: './guestbook.component.css',
})
export class GuestbookComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MessageService);

  messages = signal<Message[]>([]);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
    passcode: ['', Validators.required],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.service.list().subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: () => this.error.set('Could not load messages.'),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(false);

    this.service.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.form.reset();
        this.submitting.set(false);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 403) {
          this.error.set('Wrong passcode.');
        } else if (err.status === 400) {
          this.error.set('Please fill in name and message.');
        } else {
          this.error.set('Something went wrong. Try again.');
        }
      },
    });
  }
}
```

### 6.4 `guestbook/guestbook.component.html`

```html
<section class="card">
  <h1>Sign the guestbook</h1>

  <form [formGroup]="form" (ngSubmit)="submit()">
    <label>
      Name
      <input type="text" formControlName="name" />
    </label>

    <label>
      Message
      <textarea rows="4" formControlName="message"></textarea>
    </label>

    <label>
      Passcode
      <input type="password" formControlName="passcode" />
    </label>

    <button type="submit" [disabled]="submitting()">
      {{ submitting() ? 'Sending…' : 'Submit' }}
    </button>

    @if (success()) {
      <p class="ok">Thanks! Your message was added.</p>
    }
    @if (error()) {
      <p class="err">{{ error() }}</p>
    }
  </form>
</section>

<section class="card">
  <h2>Messages</h2>
  @if (messages().length === 0) {
    <p>No messages yet.</p>
  } @else {
    <ul class="messages">
      @for (m of messages(); track m.id) {
        <li>
          <strong>{{ m.name }}</strong>
          <span class="date">{{ m.createdAt | date: 'medium' }}</span>
          <p>{{ m.message }}</p>
        </li>
      }
    </ul>
  }
</section>
```

### 6.5 `guestbook/guestbook.component.css`

```css
:host {
  display: block;
  max-width: 640px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
}
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
}
input,
textarea {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem;
  font: inherit;
  box-sizing: border-box;
}
button {
  padding: 0.5rem 1rem;
  font: inherit;
  cursor: pointer;
}
.ok {
  color: #157347;
}
.err {
  color: #b02a37;
}
.messages {
  list-style: none;
  padding: 0;
}
.messages li {
  border-top: 1px solid #eee;
  padding: 0.75rem 0;
}
.date {
  color: #888;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}
```

### 6.6 Mount it in the root component

The root component file is `src/app/app.component.ts` **or** `src/app/app.ts`
depending on your CLI version. Open it and:

- add `GuestbookComponent` to its `imports` array
- replace its `template`/`templateUrl` content with just: `<app-guestbook />`

Example (`app.component.ts`):

```typescript
import { Component } from '@angular/core';
import { GuestbookComponent } from './guestbook/guestbook.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GuestbookComponent],
  template: '<app-guestbook />',
})
export class AppComponent {}
```

If it uses `templateUrl`, instead put `<app-guestbook />` in that HTML file and
delete the rest.

### 6.7 Run

```bash
ng serve
```

> **Verify Phase 6**
> http://localhost:4200 shows the form and an empty "Messages" section, no console
> errors. (Submitting won't work yet — backend isn't running. That's Phase 7.)

---

## Phase 7 — End-to-end in dev mode (~25 min)

Three terminals (or VS Code split terminal):

```bash
# terminal 1 — database
cd ~/workspace/fullstack-practice && docker compose up -d

# terminal 2 — backend
cd ~/workspace/fullstack-practice/backend && ./mvnw spring-boot:run

# terminal 3 — frontend
cd ~/workspace/fullstack-practice/frontend && ng serve
```

Open http://localhost:4200 and:

1. Submit with name + message + passcode `let-me-in` → green success, message
   appears in the list below.
2. Submit with passcode `nope` → red "Wrong passcode."
3. Submit with an empty name → the form blocks it client-side; force it by
   editing and you should still get the red validation message from the server.
4. Reload the page → messages are still there (they're in Postgres).

> **Verify Phase 7**
> All four behaviours above. Then:
> ```bash
> docker compose exec db psql -U guestbook -d guestbook -c 'select name, body, created_at from messages order by created_at desc;'
> ```
> Your successful submissions are listed. Stop backend and frontend (`Ctrl+C`).
> **This is a complete working full-stack app.** Phases 8–10 package it.

---

## Phase 8 — Dockerize the backend (~45 min)

### 8.1 `backend/Dockerfile`

```dockerfile
# --- build stage ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B clean package -DskipTests

# --- runtime stage ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.2 `backend/.dockerignore`

```
target/
.git/
*.iml
```

### 8.3 Build and smoke-test against the running dev DB

```bash
cd ~/workspace/fullstack-practice/backend
docker build -t guestbook-backend .

# run it wired to the compose network so it can reach "db"
docker run --rm --name gb-backend \
  --network fullstack-practice_default \
  -e SPRING_PROFILES_ACTIVE=docker \
  -e APP_SUBMISSION_PASSCODE=let-me-in \
  -p 8081:8081 \
  guestbook-backend
```

(The network name is `<folder>_default`; confirm with `docker network ls`.)

> **Verify Phase 8**
> ```bash
> curl -s localhost:8081/actuator/health      # {"status":"UP"}
> curl -s localhost:8081/api/messages          # your earlier rows
> ```
> `Ctrl+C` to stop the container.

---

## Phase 9 — Dockerize the frontend + nginx proxy (~45 min)

### 9.1 Confirm the build output path

```bash
cd ~/workspace/fullstack-practice/frontend
npm run build
ls dist/frontend            # expect a "browser" folder
```

If the folder is `dist/frontend/browser`, the Dockerfile below is correct. If your
Angular version puts files directly in `dist/frontend`, drop `/browser` from the
`COPY` line in 9.2.

### 9.2 `frontend/Dockerfile`

```dockerfile
# --- build stage ---
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
```

### 9.3 `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.4 `frontend/.dockerignore`

```
node_modules/
dist/
.angular/
```

> **Verify Phase 9**
> ```bash
> docker build -t guestbook-frontend ~/workspace/fullstack-practice/frontend
> ```
> Build completes. (It can't fully run alone — it needs `backend` on the network,
> which Phase 10 provides.)

---

## Phase 10 — Full stack via Compose (~30 min)

### 10.1 `docker-compose.full.yml` (project root)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: guestbook
      POSTGRES_USER: guestbook
      POSTGRES_PASSWORD: guestbook
    volumes:
      - guestbook_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U guestbook -d guestbook"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      SPRING_PROFILES_ACTIVE: docker
      APP_SUBMISSION_PASSCODE: ${APP_SUBMISSION_PASSCODE:-let-me-in}
      POSTGRES_USER: guestbook
      POSTGRES_PASSWORD: guestbook
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8081/actuator/health | grep -q UP"]
      interval: 10s
      timeout: 5s
      retries: 12

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  guestbook_pgdata:
```

### 10.2 Run from cold

```bash
cd ~/workspace/fullstack-practice

# stop the dev DB so ports/volumes don't clash
docker compose down

# build and start all three
docker compose -f docker-compose.full.yml up --build
```

Wait until you see `frontend` start. Open **http://localhost:8080**.

### 10.3 Exercise it

Same four checks as Phase 7, but now everything is containers and the requests go
Angular → nginx → Spring Boot → Postgres.

```bash
# from another terminal
curl -s localhost:8080/api/messages
```

### 10.4 Shut down

```bash
# Ctrl+C, then:
docker compose -f docker-compose.full.yml down          # keep data
docker compose -f docker-compose.full.yml down -v       # wipe the DB volume too
```

> **Verify Phase 10**
> A fresh `docker compose -f docker-compose.full.yml up --build` from a clean state
> gives a working guestbook at :8080 with no manual steps. **Done.**

---

## Phase 11 — Write your RUNBOOK.md (~30 min)

Create `RUNBOOK.md` in the project root. Keep it terse — it's for *you* on build 2.
Suggested skeleton:

```markdown
# Guestbook rebuild runbook

## 0. Assumes installed: docker, java21+maven (sdkman), node22 (nvm), @angular/cli

## 1. Skeleton
- mkdir project, `backend/`, `frontend/`
- docker-compose.yml (postgres:16, db=user=pass=guestbook, port 5432, healthcheck)
- .env: APP_SUBMISSION_PASSCODE=let-me-in
- docker compose up -d

## 2. Backend  (curl start.spring.io: web,data-jpa,postgresql,validation,actuator)
- application.yml: port 8081, datasource localhost, ddl-auto update, app.submission-passcode
- application-docker.yml: datasource host = db
- main class: @ConfigurationPropertiesScan
- packages: config/{AppProperties,WebConfig}  message/{Message,MessageRepository,
  CreateMessageRequest,MessageResponse,InvalidPasscodeException,MessageService,
  MessageController}  error/ApiExceptionHandler
- ./mvnw spring-boot:run ; curl 201/403/400/GET

## 3. Frontend  (ng new frontend --style=css --ssr=false)
- app.config.ts: add provideHttpClient()
- proxy.conf.json -> :8081 ; angular.json serve.options.proxyConfig
- core/{message.model,message.service}  guestbook/{ts,html,css}
- mount <app-guestbook /> in root component
- ng serve ; test in browser

## 4. Dockerize
- backend/Dockerfile (maven build -> jre-alpine), .dockerignore
- frontend/Dockerfile (node build -> nginx), nginx.conf (/api -> backend:8081), .dockerignore
- docker-compose.full.yml (db + backend + frontend, healthchecks, 8080:80)
- docker compose -f docker-compose.full.yml up --build ; test :8080
```

Then paste your actual file contents (or keep them in a `snippets/` folder) so
build 2 is copy-paste-adjust.

---

## The practice loop

| Build | How | Target time |
|-------|-----|-------------|
| 1 | This guide, top to bottom, in a throwaway folder | 1–2 days |
| 2 | 2–3 days later. RUNBOOK.md only; this guide as fallback. Fix RUNBOOK wherever you peeked. | ~4 h |
| 3 | RUNBOOK + memory. | < 3 h |
| 4+ | Add one deferred technology (see PLAN.md §7) as a new phase, then keep it in the rebuild. | — |

Always start from an empty directory: `mkdir ~/practice/gb-02 && cd $_`.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `mvn`/`ng`/`java` not found in a new shell | SDKMAN/nvm init lines are in `~/.bashrc`; open a new login shell or `source ~/.bashrc`. |
| Backend: `Connection refused` to 5432 | `docker compose up -d` not running, or you're on the `docker` profile locally. Unset `SPRING_PROFILES_ACTIVE`. |
| Backend starts then exits in compose | `db` not healthy yet — the `depends_on: condition: service_healthy` handles it; if you removed that, add it back. |
| Angular calls return 404 for `/api/...` | Proxy not active. Run `ng serve` (proxy is wired in `angular.json`) or `ng serve --proxy-config proxy.conf.json`. |
| CORS error in browser console (dev) | `WebConfig` missing or origin mismatch — must be exactly `http://localhost:4200`. |
| `COPY --from=build /app/dist/frontend/browser` fails | Your Angular version's output path differs. `ls frontend/dist/frontend` and adjust the path. |
| nginx container: `host not found in upstream "backend"` | Running frontend image without the compose network. Use `docker-compose.full.yml`. |
| Port already in use (5432/8080/8081) | Another Postgres or a leftover container. `docker ps`, stop it, or change the host port mapping. |
| Wiped data unexpectedly | `docker compose ... down -v` removes the volume. Use `down` without `-v` to keep data. |

---

## What you can say you've built

- A REST API in **Java 21 / Spring Boot**, built with **Maven**, using **Spring Data JPA**
  over **PostgreSQL**, with DTO validation, a shared-secret gate on writes, and
  RFC-7807 problem responses.
- An **Angular** SPA with a reactive form, an `HttpClient` service, signal-based
  state, and the modern control-flow template syntax.
- A dev proxy for same-origin API calls, and a production packaging where **nginx**
  serves the built SPA and reverse-proxies the API.
- Everything reproducible with **Docker Compose** — `up --build` from a clean
  checkout yields a working app, which is exactly the handoff point to a CI/CD
  pipeline later.
```
