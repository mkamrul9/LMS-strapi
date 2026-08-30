# LMSPrime — System Architecture & Engineering Master Specification

---

## 🏛️ Executive Summary

**LMSPrime** is an enterprise-grade, multi-tenant Learning Management System engineered to provide strict Role-Based Access Control (RBAC), multi-tenant data isolation, server-side anti-cheat quiz auto-grading, atomic curriculum progress tracking, and an editorial blog publishing engine.

The platform is constructed with **Next.js 16 (App Router)** and **React 19** on the frontend, paired with a headless **Strapi v5 CMS (Node.js/TypeScript/SQLite/PostgreSQL)** on the backend.

```mermaid
graph TD
    Client["Client Browser (React 19 / Tailwind CSS)"]
    EdgeMiddleware["Next.js Edge Middleware (RBAC Cookie Interceptor)"]
    AxiosLayer["Axios Singleton (JWT Injection + Strapi v5 Normalizer)"]
    StrapiGateway["Strapi v5 API Gateway (Koa Pipeline & Users-Permissions)"]
    CustomControllers["Custom Controller Guardrails (RBAC & Business Logic)"]
    Database["Database Layer (SQLite / PostgreSQL)"]

    Client -->|HTTP Request| EdgeMiddleware
    EdgeMiddleware -->|Authorized SSR/RSC| Client
    Client -->|API Mutation / Query| AxiosLayer
    AxiosLayer -->|Bearer JWT + Normalized Params| StrapiGateway
    StrapiGateway -->|JWT Authentication| CustomControllers
    CustomControllers -->|Parameterized Query / Mutation| Database
    Database -->|Raw Entity Result| CustomControllers
    CustomControllers -->|Sanitized JSON Response| StrapiGateway
    StrapiGateway -->|HTTP Response| AxiosLayer
    AxiosLayer -->|Recursive Normalization| Client
```

---

## 🧱 Technology Stack Matrix: Why, What & How

| Layer | Technology | Why Selected | What It Does in LMSPrime | How It Is Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Zero-flash server rendering, edge route routing, Turbopack compilation speed, built-in layout nesting. | Powers all 27 application routes, public catalog, course player, and role studios. | Configured via `src/app/` with nested layouts (`ProtectedLayout.tsx`), dynamic routes (`[courseId]`), and server actions capability. |
| **UI Runtime** | **React 19** | Concurrent rendering, latest hooks architecture, optimistic updates, modern ecosystem compatibility. | Manages reactive state across progress toggling, quiz scoring, and course building. | Uses client components (`'use client'`) for interactive players and server-ready layout wrappers. |
| **Styling & Design** | **Tailwind CSS v4 + Lucide Icons** | Utility-first rapid styling, zero CSS bloat, clean glassmorphic aesthetics, modern responsive tokens. | Drives typography, glassmorphism, responsive navigation bars, and status pills. | Configured in `globals.css` with dark/light slate palette and smooth transitions. |
| **Backend Engine** | **Strapi v5 (Headless CMS)** | Rapid entity modeling, built-in RBAC via `users-permissions`, extensible controllers, relational database ORM. | Serves as the central API gateway, content store, and security enforcement layer. | Extends core controllers (`createCoreController`) with custom overrides for RBAC and business logic. |
| **Database** | **SQLite (Dev) / PostgreSQL (Prod)** | Zero-config atomic transactions locally; scalable relational clustering in production. | Persists users, roles, courses, curriculum lessons, quizzes, submissions, progress rows, and blogs. | Configured in `backend/config/database.ts` with dynamic environment-driven client switching (`DATABASE_CLIENT`). |
| **Client Networking** | **Axios Singleton** | Centralized interceptors, uniform error handling, automatic JWT injection, payload normalization. | Handles all client-to-backend REST API communications. | Created in `src/lib/axios.ts` with request/response interceptors for Strapi v5 payload flattening. |
| **Auth & Session Sync** | **JWT + Cookies (`cookies-next`)** | Edge-compatible session reading, cross-tab synchronization, tamper-proof state. | Holds the session token and user role for instant Edge Middleware evaluation. | `AuthContext.tsx` sets `jwt` and `userRole` cookies on login and clears them on logout. |
| **Edge Protection** | **Next.js Edge Middleware** | Sub-millisecond routing decisions before page rendering, eliminating layout flash for unauthorized users. | Intercepts private route prefixes (`/admin`, `/instructor`, `/content-manager`, `/student`). | Implemented in `src/middleware.ts` evaluating role cookies against path prefixes. |

---

## 👥 Multi-Tenant RBAC Matrix & Architecture

The system defines **4 distinct platform roles**. Security is enforced at **both the Edge Routing Layer (frontend) and the Entity Controller Layer (backend)**.

```mermaid
classDiagram
    class User {
        +Int id
        +String username
        +String email
        +Role role
    }
    class Role {
        +Int id
        +String name
        +String type
        +Permission[] permissions
    }
    class Course {
        +Int id
        +String title
        +String description
        +User instructor
        +Lesson[] lessons
        +Quiz[] quizzes
    }
    class Lesson {
        +Int id
        +String title
        +String content
        +String videoUrl
        +Int order
        +Course course
    }
    class Quiz {
        +Int id
        +String title
        +Course course
        +Question[] questions
    }
    class QuizSubmission {
        +Int id
        +User student
        +Quiz quiz
        +Int score
        +Int totalQuestions
    }
    class Progress {
        +Int id
        +User student
        +Lesson lesson
        +Course course
        +Boolean isCompleted
    }
    class Enrollment {
        +Int id
        +User student
        +Course course
        +DateTime enrolledAt
    }
    class Blog {
        +Int id
        +String title
        +String content
        +User author
        +DateTime publishedAt
    }

    User "1" --> "1" Role : holds
    Course "1" --> "1" User : created by (Instructor)
    Course "1" --> "*" Lesson : contains
    Course "1" --> "*" Quiz : assesses with
    QuizSubmission "*" --> "1" User : submitted by (Student)
    QuizSubmission "*" --> "1" Quiz : graded for
    Progress "*" --> "1" User : tracked for (Student)
    Progress "*" --> "1" Lesson : tracks
    Enrollment "*" --> "1" User : enrolled by (Student)
    Enrollment "*" --> "1" Course : targets
    Blog "*" --> "1" User : authored by (Content Manager / Admin)
```

### 📋 Role Permission Matrix

| Capability / Action | Admin | Content Manager | Instructor | Student | Public (Guest) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Users & Assign Roles** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Platform Analytics & Metrics** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create / Edit / Delete Any Course** | ✅ | ✅ | ❌ (Own only) | ❌ | ❌ |
| **Create / Edit / Delete Lessons** | ✅ | ✅ | ❌ (Own courses) | ❌ | ❌ |
| **Create / Edit Quizzes** | ✅ | ✅ | ❌ (Own courses) | ❌ | ❌ |
| **View Student Progress & Rosters** | ✅ | ✅ | ❌ (Own courses) | ❌ (Own only) | ❌ |
| **Write / Edit / Delete / Publish Blogs** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Draft Blogs** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Read Published Course Catalog & Blogs** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Enroll in Masterclasses** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Take Quizzes & Receive Auto-Grading** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Mark Lessons Complete (Progress Sync)**| ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 🔄 End-to-End Data Flow Architecture

### 1. Global Request / Response Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Client Browser)
    participant Edge as Next.js Edge Middleware
    participant Axios as Axios Singleton Interceptor
    participant Koa as Strapi Koa Pipeline
    participant AuthPlugin as Users-Permissions Plugin
    participant Controller as Custom API Controller
    participant DB as SQLite / PostgreSQL Database

    Student->>Edge: GET /student/courses/2
    Edge->>Edge: Validate `jwt` & `userRole === 'Student'` cookies
    Edge-->>Student: Render Course Player Page Layout (200 OK)

    Student->>Axios: POST /api/progresses { lesson: 1, course: 2, isCompleted: true }
    Axios->>Axios: Read `jwt` cookie -> Inject `Authorization: Bearer <token>`
    Axios->>Koa: HTTP POST /api/progresses
    Koa->>AuthPlugin: Verify JWT signature & load ctx.state.user
    AuthPlugin-->>Koa: Hydrated Authenticated User Context
    Koa->>Controller: Route to custom `create` handler in progress.ts

    Controller->>DB: Query existing progress for (student_id, lesson_id, course_id)
    DB-->>Controller: Existing footprint record

    alt Record Exists
        Controller->>DB: UPDATE progress SET isCompleted = true WHERE id = ?
    else Record Does Not Exist
        Controller->>DB: INSERT INTO progresses (student, lesson, course, isCompleted)
    end
    DB-->>Controller: Updated / Created Entity

    Controller-->>Koa: Return 200 OK + JSON Payload
    Koa-->>Axios: HTTP 200 OK Response
    Axios->>Axios: Normalize Strapi v5 structure ({ data: { id, ...attributes } })
    Axios-->>Student: Return Normalized Data to React Hook
    Student->>Student: Re-render UI + Fire Sonner Toast Notification
```

---

### 2. Blind Anti-Cheat Quiz Auto-Grading Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Browser
    participant QuizPage as Quiz Player UI
    participant Backend as POST /api/quizzes/:id/submit
    participant DB as Database (Quiz & Questions Table)
    participant Submissions as Quiz Submissions Table

    Student->>QuizPage: Select Options for Questions 1..N
    Student->>QuizPage: Click "Submit Quiz"
    Note over QuizPage,Backend: Client sends ONLY question IDs and chosen option strings.<br/>Correct answers are NEVER exposed to client.
    QuizPage->>Backend: Payload: { answers: [{ questionId: 10, answer: "Data Cache" }] }

    Backend->>DB: Query Quiz by ID including `questions.correctAnswer`
    DB-->>Backend: Return Quiz entity with hidden server answer keys

    loop Blind Evaluation Loop
        Backend->>Backend: Compare student answer with `dbQuestion.correctAnswer`
        Backend->>Backend: If matched, increment score
    end

    Backend->>Submissions: INSERT INTO quiz_submissions (student_id, quiz_id, score, totalQuestions)
    Submissions-->>Backend: Immutable Submission Record Created (ID: 42)

    Backend-->>QuizPage: Return { id: 42, score: 3, totalQuestions: 3, percentage: 100 }
    QuizPage->>Student: Render Grade Scorecard UI with Celebration Animation
```

---

### 3. Atomic Progress Tracking & Percentage Math Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Browser
    participant CoursePage as Course Player Page
    participant ProgressAPI as POST /api/progresses
    participant PercentageAPI as GET /api/progresses/percentage/:courseId
    participant DB as Database

    Student->>CoursePage: Click "Mark as Complete" on Lesson #2
    CoursePage->>ProgressAPI: POST { lesson: 2, course: 1, isCompleted: true }
    ProgressAPI->>DB: Atomic Upsert against (student, lesson, course) compound index
    DB-->>ProgressAPI: Success
    ProgressAPI-->>CoursePage: Progress Stored

    CoursePage->>PercentageAPI: GET /api/progresses/percentage/1
    PercentageAPI->>DB: COUNT(lessons) WHERE course = 1 (Denominator)
    DB-->>PercentageAPI: totalLessons = 3
    PercentageAPI->>DB: COUNT(progress) WHERE student = ? AND course = 1 AND isCompleted = true (Numerator)
    DB-->>PercentageAPI: completedLessons = 2
    PercentageAPI->>PercentageAPI: Math.round((2 / 3) * 100) = 67%
    PercentageAPI-->>CoursePage: { percentage: 67, completed: 2, total: 3 }
    CoursePage->>Student: Update progress bar & curriculum checkmark
```

---

### 4. Editorial Blog Draft-to-Publish Workflow

```mermaid
stateDiagram-v2
    [*] --> Draft: Content Manager authors new article
    Draft --> Draft: Auto-saved in Editor (publishedAt = null)
    
    state VisibilityCheck {
        Draft --> HiddenFromPublic: Query GET /api/blogs (Public / Student)
        Draft --> VisibleToManager: Query GET /api/blogs (Content Manager / Admin)
    }

    Draft --> Published: Content Manager / Admin toggles "Publish" (publishedAt = NOW())
    Published --> VisibleToAll: Query GET /api/blogs (Public / Student / All Roles)
    Published --> Draft: Content Manager / Admin toggles "Unpublish"
    Published --> Deleted: Admin / Author deletes article
    Draft --> Deleted: Admin / Author deletes draft
    Deleted --> [*]
```

---

## 💻 Deep-Dive Code Techniques (Why, What & How)

### 1. Blind Anti-Cheat Quiz Evaluation Engine

- **Why**: Standard LMS implementations often send the correct answer key in the initial course payload, allowing tech-savvy students to inspect Network DevTools or React State to cheat.
- **What**: Client payloads only transmit user-selected option values. Correct answer keys remain exclusively on the database server.
- **How**: Implemented in [backend/src/api/quiz/controllers/quiz.ts](file:///d:/SWE/UNIQUE%20WORK/LMS-strappi/LMS-strapi/backend/src/api/quiz/controllers/quiz.ts#L23-L83).

```typescript
// backend/src/api/quiz/controllers/quiz.ts
async submit(ctx) {
  const user = ctx.state.user;
  if (!user) return ctx.unauthorized();

  const { id: quizId } = ctx.params;
  const bodyData = ctx.request.body?.data || ctx.request.body || {};
  const answers = bodyData.answers;

  if (!answers || !Array.isArray(answers)) {
    return ctx.badRequest('Answers must be provided as an array.');
  }

  // 1. Secure Data Retrieval with Server-Only Answers
  const quiz = await strapi.db.query('api::quiz.quiz').findOne({
    where: /^\d+$/.test(quizId) ? { id: parseInt(quizId, 10) } : { documentId: quizId },
    populate: { questions: true },
  });

  if (!quiz) return ctx.notFound('Quiz not found');

  let score = 0;
  const totalQuestions = quiz.questions?.length || 0;
  if (totalQuestions === 0) return ctx.badRequest('This quiz has no questions.');

  // 2. Blind Evaluation Algorithm
  quiz.questions.forEach((dbQuestion) => {
    const studentAnswer = answers.find(
      (a) => a.questionId === dbQuestion.id || a.id === dbQuestion.id
    );
    const studentChosen = studentAnswer?.answer || studentAnswer?.selectedOption || studentAnswer?.choice;
    if (studentChosen && studentChosen === dbQuestion.correctAnswer) {
      score++;
    }
  });

  // 3. Immutable Record Creation
  const submission = await strapi.entityService.create('api::quiz-submission.quiz-submission', {
    data: {
      student: user.id,
      quiz: quiz.id,
      score,
      totalQuestions,
      publishedAt: new Date(),
    },
  });

  // 4. Return Computed Scorecard
  return ctx.send({
    data: {
      id: submission.id,
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
    }
  });
}
```

---

### 2. Atomic Progress Upsert & Server-Calculated Percentage

- **Why**: Repeatedly clicking "Complete" shouldn't spawn duplicate database entries, and client-side percentage math is vulnerable to stale local caches.
- **What**: The controller performs an idempotent search-and-mutate upsert on `(student, lesson, course)` and computes percentages mathematically via database count queries.
- **How**: Implemented in [backend/src/api/progress/controllers/progress.ts](file:///d:/SWE/UNIQUE%20WORK/LMS-strappi/LMS-strapi/backend/src/api/progress/controllers/progress.ts#L21-L133).

```typescript
// backend/src/api/progress/controllers/progress.ts
async getCoursePercentage(ctx) {
  const user = ctx.state.user;
  if (!user) return ctx.unauthorized();

  const { courseId } = ctx.params;
  let numericCourseId = /^\d+$/.test(courseId) ? parseInt(courseId, 10) : null;
  if (!numericCourseId) {
    const courseObj = await strapi.db.query('api::course.course').findOne({ where: { documentId: courseId } });
    if (courseObj) numericCourseId = courseObj.id;
  }

  // 1. Denominator: Total active lessons in this course
  const totalLessons = await strapi.db.query('api::lesson.lesson').count({
    where: { course: numericCourseId },
  });

  if (totalLessons === 0) {
    return ctx.send({ data: { percentage: 0, completed: 0, total: 0 } });
  }

  // 2. Numerator: Lessons completed by this specific student
  const completedLessons = await strapi.db.query('api::progress.progress').count({
    where: {
      student: user.id,
      course: numericCourseId,
      isCompleted: true,
    },
  });

  // 3. Mathematical computation
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return ctx.send({
    data: { percentage, completed: completedLessons, total: totalLessons }
  });
}
```

---

### 3. Edge Middleware RBAC Guard

- **Why**: Client-side route guards (e.g. `useEffect` redirects) cause a noticeable "flash of unauthorized content" while JavaScript mounts.
- **What**: Next.js Edge Middleware intercepts incoming HTTP requests on the edge before HTML rendering and validates authentication cookies.
- **How**: Implemented in [frontend/src/middleware.ts](file:///d:/SWE/UNIQUE%20WORK/LMS-strappi/LMS-strapi/frontend/src/middleware.ts#L14-L85).

```typescript
// frontend/src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // Prevent logged-in users from hitting login/register
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  const privatePrefixes = ['/admin', '/instructor', '/student', '/content-manager', '/dashboard'];
  const isPrivateRoute = privatePrefixes.some(prefix => pathname.startsWith(prefix));

  if (isPrivateRoute) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));

    const isAdmin = role === 'Admin';
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/instructor') && role !== 'Instructor' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/content-manager') && role !== 'Content Manager' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/student') && role !== 'Student' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}
```

---

### 4. Axios Singleton with Strapi v5 Hybrid Normalizer

- **Why**: Strapi v5 returns flattened JSON (`{ id, title }`), while many standard libraries expect legacy v4 nested attributes (`{ id, attributes: { title } }`). Direct mismatch causes client runtime errors.
- **What**: An interceptor dynamically populates both flat properties and `.attributes` wrappers recursively, allowing components to access data via any schema convention seamlessly.
- **How**: Implemented in [frontend/src/lib/axios.ts](file:///d:/SWE/UNIQUE%20WORK/LMS-strappi/LMS-strapi/frontend/src/lib/axios.ts#L10-L113).

```typescript
// frontend/src/lib/axios.ts
function normalizeStrapiData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeStrapiData);

  const res: any = { ...data };
  if (res.id !== undefined || res.documentId !== undefined) {
    if (!res.attributes) {
      const attrs: any = {};
      for (const [k, v] of Object.entries(res)) {
        if (k !== 'id' && k !== 'documentId' && k !== 'attributes') {
          attrs[k] = normalizeStrapiData(v);
        }
      }
      res.attributes = attrs;
    }
  }
  return res;
}
```

---

## ⚡ Challenges Faced & Engineering Solutions

### 1. Strapi v5 Hybrid DocumentID vs Numeric SQLite ID Lookups
- **Challenge**: In Strapi v5, entities are assigned alphanumeric `documentId` strings (e.g. `tnp72hmb...`), but relational queries and legacy database keys use numeric integers (e.g. `2`). Route parameters could pass either, causing queries to fail with `404 Not Found`.
- **Solution**: Implemented regex-based parameter detection in controllers:
  ```typescript
  const whereClause = /^\d+$/.test(id) 
    ? { id: parseInt(id, 10) } 
    : { documentId: id };
  const course = await strapi.db.query('api::course.course').findOne({ where: whereClause });
  ```

### 2. Default Role Registration Bug in Strapi v5
- **Challenge**: Setting `default_role` in Strapi's `advanced` plugin store to a numeric ID caused registration to throw `"impossible to find the role"` because Strapi v5 queries default roles by string `type` rather than integer `id`.
- **Solution**: Overrode bootstrap logic in `backend/src/index.ts`:
  ```typescript
  const studentRole = await roleService.findOne({ where: { name: 'Student' } });
  await pluginStore.set({
    value: { ...advancedConfig, default_role: studentRole?.type || 'student' }
  });
  ```

### 3. Missing Upload Directory on Initial Clone
- **Challenge**: On fresh installations or containerized cold starts, `@strapi/provider-upload-local` throws an unhandled exception if `backend/public/uploads` does not exist on disk.
- **Solution**: Added a persistent `.gitkeep` anchor inside `backend/public/uploads/` and ensured auto-creation in deployment pipelines.

### 4. Admin Self-Lockout Vulnerability
- **Challenge**: Admins managing roles from the admin table could inadvertently demote their own account, locking themselves out of governance features permanently.
- **Solution**: Added backend controller guardrail:
  ```typescript
  if (Number(id) === Number(ctx.state.user.id)) {
    return ctx.badRequest('You cannot change your own role.');
  }
  ```

---

## 🛡️ Edge Cases Handled Matrix

| Category | Edge Case Scenario | System Behavior / Handling |
| :--- | :--- | :--- |
| **Enrollment** | Student attempts to enroll twice in the same course. | Intercepted in `enrollment.ts` with `400 Bad Request: "You are already enrolled in this course."` |
| **Enrollment** | Instructor or Guest attempts to enroll. | Intercepted with `403 Forbidden: "Only Students can enroll in courses."` |
| **Curriculum** | Course has 0 lessons created. | `getCoursePercentage` handles division by zero, safely returning `{ percentage: 0, completed: 0, total: 0 }`. |
| **Quiz** | Quiz has 0 questions configured. | `submit` endpoint rejects with `400 Bad Request: "This quiz has no questions."` |
| **Quiz** | Student submits empty or partial answers. | Evaluated safely; unanswered questions count as `0` without throwing null pointer exceptions. |
| **RBAC** | Instructor attempts to edit another instructor's course. | Controller checks `course.instructor.id === user.id`, returning `403 Forbidden` if mismatched. |
| **RBAC** | Student tries to fetch all students' progress rows. | `find` controller inspects user role and forcibly applies `where: { student: user.id }`. |
| **Blog** | Student accesses `/api/blogs` or `/blog`. | Only articles where `publishedAt != null` are returned; draft posts remain strictly invisible. |
| **Auth** | User modifies their `userRole` cookie in browser DevTools. | Backend API independently decodes the JWT and validates database records on every request; spoofed cookies are rejected on the first API call. |

---

## 🚀 Production Deployment Architecture

```mermaid
graph LR
    subgraph Vercel["Vercel Edge Network (Frontend)"]
        NextApp["Next.js 16 App Router"]
        EdgeMiddle["Edge Middleware"]
    end

    subgraph Railway["Railway Cloud Platform (Backend)"]
        StrapiApp["Strapi v5 Headless CMS"]
        PostgresDB[("PostgreSQL Managed DB")]
        Cloudinary["Cloudinary CDN (Media/Uploads)"]
    end

    Users["Global Users"] -->|HTTPS| Vercel
    NextApp -->|API Calls (NEXT_PUBLIC_API_URL)| StrapiApp
    StrapiApp -->|Connection String| PostgresDB
    StrapiApp -->|Asset Uploads| Cloudinary
```

### Environment Variable Contract

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api
```

#### Backend (`backend/.env`):
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=secretKeyA,secretKeyB,secretKeyC,secretKeyD
API_TOKEN_SALT=apiTokenSaltSecretKey123456
ADMIN_JWT_SECRET=adminJwtSecretKey123456
TRANSFER_TOKEN_SALT=transferTokenSaltSecretKey123456
JWT_SECRET=jwtSecretTokenForLmsStrapi123456
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://postgres:password@host:port/railway
```
