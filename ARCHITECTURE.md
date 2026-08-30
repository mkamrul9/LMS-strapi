# LMSPrime — System Architecture & Engineering Master Specification

---

## 🏛️ Executive Summary

**LMSPrime** is an enterprise-grade, multi-tenant Learning Management System engineered to provide strict Role-Based Access Control (RBAC), multi-tenant data isolation, server-side anti-cheat quiz auto-grading, atomic curriculum progress tracking, and an editorial blog publishing engine.

The platform is constructed with **Next.js 16 (App Router)** and **React 19** on the frontend, paired with a headless **Strapi v5 CMS (Node.js / TypeScript / SQLite / PostgreSQL)** on the backend.

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

## 🔒 1. Role-Based Access: Backend Enforcement (Beyond UI Hiding)

Many basic applications make the mistake of only hiding buttons in the UI. If a user sends a raw HTTP request via `cURL` or Postman, insecure APIs will execute the action. 

In **LMSPrime**, every critical action is verified **server-side inside Strapi custom controllers** by inspecting the decoded JWT user entity and querying the database before any mutation or read occurs.

### A. Strict Student-Only Enrollment Enforcement
Even if an Admin or Instructor sends a direct `POST /api/enrollments` request, the server blocks it with `403 Forbidden`:

```typescript
// backend/src/api/enrollment/controllers/enrollment.ts
async create(ctx) {
  const user = ctx.state.user;
  if (!user) return ctx.unauthorized('You must be logged in to enroll.');

  // 1. Fetch user role directly from database (tamper-proof)
  const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
    populate: ['role'],
  });

  // 2. Reject ANY role other than Student
  if (fullUser?.role?.name !== 'Student') {
    return ctx.forbidden('Access denied. Only Students can enroll in courses.');
  }

  // 3. Prevent duplicate enrollment (Idempotency)
  const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
    where: { student: user.id, course: numericCourseId },
  });
  if (existingEnrollment) return ctx.badRequest('You are already enrolled in this course.');
  
  // Proceed with creation...
}
```

### B. Multi-Tenant Course Ownership Enforcement
An Instructor cannot mutate or add lessons/quizzes to another instructor's course:

```typescript
// backend/src/api/lesson/controllers/lesson.ts
async verifyCourseOwnership(userId, courseId) {
  const course = await strapi.db.query('api::course.course').findOne({
    where: /^\d+$/.test(courseId) ? { id: parseInt(courseId, 10) } : { documentId: courseId },
    populate: ['instructor']
  });
  // Validates author ownership on the database level
  return course && (course.instructor?.id === userId || course.instructor?.documentId === userId);
}
```

### C. Admin Self-Lockout & Superuser Protection
Admins cannot accidentally demote themselves and lock out the system:

```typescript
// backend/src/api/admin-dashboard/controllers/admin-dashboard.ts
async updateUserRole(ctx) {
  const { id } = ctx.params;
  const currentAdmin = ctx.state.user;

  // Prevent self-demotion
  if (Number(id) === Number(currentAdmin.id)) {
    return ctx.badRequest('You cannot change your own role.');
  }
  // Proceed with role reassignment...
}
```

---

## 🔄 2. End-to-End Data Flow: Student Progress Flow

Here is how data moves step-by-step from the React client to the Strapi backend and back when a student marks a lesson completed:

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Client Browser)
    participant Edge as Next.js Edge Middleware
    participant Axios as Axios Singleton Interceptor
    participant Koa as Strapi Koa Pipeline
    participant AuthPlugin as Users-Permissions Plugin
    participant Controller as Custom Progress Controller
    participant DB as SQLite / PostgreSQL Database

    Student->>Edge: GET /student/courses/2
    Edge->>Edge: Read `jwt` & `userRole === 'Student'` cookies
    Edge-->>Student: Render Course Player Page Layout (200 OK)

    Student->>Axios: Click "Mark as Completed" -> POST /api/progresses { lesson: 1, course: 2, isCompleted: true }
    Axios->>Axios: Read `jwt` cookie -> Inject `Authorization: Bearer <token>`
    Axios->>Koa: HTTP POST /api/progresses
    Koa->>AuthPlugin: Verify JWT signature & decode user payload
    AuthPlugin-->>Koa: Hydrate `ctx.state.user` (ID: 4)
    Koa->>Controller: Route to custom `create` handler in progress.ts

    Controller->>DB: Query existing record WHERE student = 4 AND lesson = 1 AND course = 2
    DB-->>Controller: Existing footprint record

    alt Record Exists
        Controller->>DB: UPDATE progresses SET isCompleted = true WHERE id = ?
    else Record Does Not Exist
        Controller->>DB: INSERT INTO progresses (student, lesson, course, isCompleted)
    end
    DB-->>Controller: Saved Entity

    Controller-->>Koa: Return 200 OK + JSON Payload
    Koa-->>Axios: HTTP 200 OK Response
    Axios->>Axios: Normalize Strapi v5 structure ({ data: { id, ...attributes } })
    Axios-->>Student: Return Normalized Data to React Hook
    Student->>Student: Re-render UI progress bar + Fire Toast Notification
```

---

## 📈 3. Progress Tracking Logic (Line-by-Line Breakdown)

### Storage Model
Progress is stored in the `progresses` database table with the following relational schema:
- `student`: Relation to `plugin::users-permissions.user` (The enrolled student)
- `lesson`: Relation to `api::lesson.lesson` (The specific lesson completed)
- `course`: Relation to `api::course.course` (The parent course)
- `isCompleted`: Boolean flag (`true` / `false`)

### Line-by-Line Code Explanation

```typescript
// File: backend/src/api/progress/controllers/progress.ts

// 1. Endpoint: GET /api/progresses/percentage/:courseId
async getCoursePercentage(ctx) {
  // Line 1: Extract authenticated user from Koa context (injected by JWT middleware)
  const user = ctx.state.user;
  if (!user) return ctx.unauthorized();

  // Line 2: Extract courseId from URL parameters
  const { courseId } = ctx.params;
  
  // Line 3: Handle Strapi v5 hybrid ID (support both numeric ID and documentId)
  let numericCourseId = /^\d+$/.test(courseId) ? parseInt(courseId, 10) : null;
  if (!numericCourseId) {
    const courseObj = await strapi.db.query('api::course.course').findOne({ 
      where: { documentId: courseId } 
    });
    if (courseObj) numericCourseId = courseObj.id;
  }

  // Line 4: Query DENOMINATOR (Total number of lessons in this course)
  const totalLessons = await strapi.db.query('api::lesson.lesson').count({
    where: { course: numericCourseId },
  });

  // Line 5: Handle edge case where course has 0 lessons (prevent division by zero)
  if (totalLessons === 0) {
    return ctx.send({ data: { percentage: 0, completed: 0, total: 0 } });
  }

  // Line 6: Query NUMERATOR (Count of lessons marked completed by THIS specific student)
  const completedLessons = await strapi.db.query('api::progress.progress').count({
    where: {
      student: user.id,
      course: numericCourseId,
      isCompleted: true,
    },
  });

  // Line 7: Compute exact rounded percentage
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  // Line 8: Return mathematical result to client
  return ctx.send({
    data: { percentage, completed: completedLessons, total: totalLessons }
  });
}
```

---

## 🎯 4. Quiz Auto-Grading Logic (Shown in Code)

### Anti-Cheat Blind Evaluation Engine
1. **Never sends answers to frontend**: The client only receives questions and option strings.
2. **Server-side matching**: When submitted, the backend compares answers directly against database records.
3. **Immutable record creation**: Stores a `quiz-submission` row linked to the student and quiz.

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
    Note over QuizPage,Backend: Client sends ONLY question IDs and selected option strings.<br/>Correct answers are NEVER exposed to client.
    QuizPage->>Backend: Payload: { answers: [{ questionId: 10, answer: "Goroutine" }] }

    Backend->>DB: Query Quiz by ID including `questions.correctAnswer`
    DB-->>Backend: Return Quiz entity with hidden server answer keys

    loop Blind Evaluation Loop
        Backend->>Backend: Compare student answer with `dbQuestion.correctAnswer`
        Backend->>Backend: If matched, increment score++
    end

    Backend->>Submissions: INSERT INTO quiz_submissions (student_id, quiz_id, score, totalQuestions)
    Submissions-->>Backend: Submission Created (ID: 42)

    Backend-->>QuizPage: Return { id: 42, score: 2, totalQuestions: 2, percentage: 100 }
    QuizPage->>Student: Render Grade Scorecard UI with celebration banner
```

### Evaluation Algorithm in Code

```typescript
// File: backend/src/api/quiz/controllers/quiz.ts
async submit(ctx) {
  const user = ctx.state.user;
  if (!user) return ctx.unauthorized();

  // 1. Verify user is a Student
  const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
    populate: ['role'],
  });
  if (fullUser?.role?.name !== 'Student') {
    return ctx.forbidden('Access denied. Only Students can take quizzes.');
  }

  const { id: quizId } = ctx.params;
  const { answers } = ctx.request.body?.data || ctx.request.body || {};

  // 2. Fetch Quiz and questions from DB with correct answers
  const quiz = await strapi.db.query('api::quiz.quiz').findOne({
    where: /^\d+$/.test(quizId) ? { id: parseInt(quizId, 10) } : { documentId: quizId },
    populate: { questions: true },
  });

  if (!quiz) return ctx.notFound('Quiz not found');

  let score = 0;
  const totalQuestions = quiz.questions?.length || 0;

  // 3. Blind Evaluation Loop
  quiz.questions.forEach((dbQuestion) => {
    const studentAnswer = answers.find(
      (a) => a.questionId === dbQuestion.id || a.id === dbQuestion.id
    );
    const chosen = studentAnswer?.answer || studentAnswer?.selectedOption;
    if (chosen && chosen === dbQuestion.correctAnswer) {
      score++;
    }
  });

  // 4. Save Immutable Submission
  const submission = await strapi.entityService.create('api::quiz-submission.quiz-submission', {
    data: {
      student: user.id,
      quiz: quiz.id,
      score,
      totalQuestions,
      publishedAt: new Date(),
    },
  });

  // 5. Send Scorecard Response
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

## 🛠️ 5. Admin Panel & Editorial Blog Workflows

### A. Admin User Role Governance Workflow

The Admin Dashboard provides real-time role promotion and reassignment (`/admin/users`). When an Admin changes a role from the dropdown:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Browser
    participant AdminUI as /admin/users UI
    participant AdminAPI as PUT /api/admin-dashboard/users/:id/role
    participant DB as Strapi Database

    Admin->>AdminUI: Select new role from Dropdown (e.g. "Instructor")
    AdminUI->>AdminAPI: PUT { roleName: "Instructor" }
    AdminAPI->>AdminAPI: Verify requester is Admin & prevent self-demotion
    AdminAPI->>DB: Query Role WHERE name = "Instructor"
    AdminAPI->>DB: UPDATE users SET role = ? WHERE id = ?
    DB-->>AdminAPI: Updated User Entity
    AdminAPI-->>AdminUI: { message: "User role updated successfully" }
    AdminUI->>Admin: Toast notification: "User promoted to Instructor"
```

### B. Blog Draft vs. Published State Isolation Workflow

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

- **Draft posts**: `publishedAt === null`. Filtered out on all public endpoints (`/courses`, `/blog`).
- **Published posts**: `publishedAt !== null`. Readable by guests and students with full Markdown parsing.
- **Admin Superuser override**: Admins can edit, publish, unpublish, or delete ANY blog post regardless of author.

---

## 🚀 6. Production Deployment Setup & Environment Variables

```mermaid
graph LR
    subgraph Vercel["Vercel Edge Network (Frontend)"]
        NextApp["Next.js 16 App Router"]
        EdgeMiddle["Edge Middleware"]
    end

    subgraph Railway["Railway Cloud Platform (Backend)"]
        StrapiApp["Strapi v5 Headless CMS"]
        PostgresDB[("PostgreSQL Managed DB")]
        Cloudinary["Cloudinary CDN (Uploads)"]
    end

    Users["Global Users"] -->|HTTPS| Vercel
    NextApp -->|API Calls (NEXT_PUBLIC_API_URL)| StrapiApp
    StrapiApp -->|Connection String| PostgresDB
    StrapiApp -->|Asset Uploads| Cloudinary
```

### Environment Variable Contracts

#### Frontend (`frontend/.env.local` / Vercel Settings):
```env
# URL pointing to the deployed Strapi Railway backend API
NEXT_PUBLIC_API_URL=https://lms-strapi-backend-production.up.railway.app/api
```

#### Backend (`backend/.env` / Railway Variables):
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=secretKeyA,secretKeyB,secretKeyC,secretKeyD
API_TOKEN_SALT=apiTokenSaltSecretKey123456
ADMIN_JWT_SECRET=adminJwtSecretKey123456
TRANSFER_TOKEN_SALT=transferTokenSaltSecretKey123456
JWT_SECRET=jwtSecretTokenForLmsStrapi123456

# Database Client Configuration (Switches dynamically from SQLite in Dev to PostgreSQL in Prod)
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://postgres:password@monorail.proxy.rlwy.net:12345/railway
```

---

## 🛡️ Edge Cases Handled Summary Matrix

| Category | Edge Case Scenario | System Behavior / Handling |
| :--- | :--- | :--- |
| **Enrollment** | Student attempts to enroll twice in the same course. | Intercepted in `enrollment.ts` with `400 Bad Request: "You are already enrolled in this course."` |
| **Enrollment** | Instructor, Content Manager, or Admin attempts to enroll. | Intercepted with `403 Forbidden: "Access denied. Only Students can enroll in courses."` |
| **Curriculum** | Course has 0 lessons created. | `getCoursePercentage` handles division by zero, safely returning `{ percentage: 0, completed: 0, total: 0 }`. |
| **Quiz** | Quiz has 0 questions configured. | `submit` endpoint rejects with `400 Bad Request: "This quiz has no questions."` |
| **Quiz** | Student submits empty or partial answers. | Evaluated safely; unanswered questions count as `0` without throwing null pointer exceptions. |
| **RBAC** | Instructor attempts to edit another instructor's course. | Controller checks `course.instructor.id === user.id`, returning `403 Forbidden` if mismatched. |
| **RBAC** | Student tries to fetch all students' progress rows. | `find` controller inspects user role and forcibly applies `where: { student: user.id }`. |
| **Blog** | Student accesses `/api/blogs` or `/blog`. | Only articles where `publishedAt != null` are returned; draft posts remain strictly invisible. |
| **Auth** | User modifies their `userRole` cookie in browser DevTools. | Backend API independently decodes the JWT and validates database records on every request; spoofed cookies fail at the controller layer. |
