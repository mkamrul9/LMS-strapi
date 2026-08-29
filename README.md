# LMSPrime - Enterprise Learning Management System

LMSPrime is an enterprise-grade, multi-tenant Learning Management System engineered with **Next.js 16 (App Router)**, **React 19**, and a headless **Strapi v5 CMS**. The platform features strict Role-Based Access Control (RBAC), tenant data isolation, a server-evaluated anti-cheat quiz engine, atomic progress tracking, and a unified modern visual design.

---

## Key Architectural Highlights

- **Multi-Tenant RBAC Matrix**: 4 distinct roles (`Student`, `Instructor`, `Content Manager`, `Admin`) enforced via Edge Middleware on the frontend and custom controller overrides on the backend.
- **Blind Anti-Cheat Quiz Engine**: Client submits only selected answer keys; the backend evaluates answers against database keys on the server and calculates scores with zero exposure to client DevTools.
- **Atomic Progress Tracking**: Race-condition-resistant upserts with mathematical completion percentages calculated on the server.
- **Strapi v5 Hybrid ID Compatibility**: Custom `findOne` controllers seamlessly resolve both SQLite numeric IDs (e.g. `2`) and Strapi v5 DocumentIDs (e.g. `tnp72hmb...`).
- **Unified Visual Design**: Responsive glassmorphic navigation, sticky navbar, multi-column footer with newsletter dispatch, user profile dashboard, and zero broken links across all 27 routes.
- **Production Seeding Engine**: Automatic bootstrap pre-seeding 4 role accounts, 6 comprehensive masterclasses, 9 curriculum lessons, server-graded quizzes, student enrollments, and 4 blog posts with high-resolution imagery.

---

## Pre-Seeded Demo Accounts

All demo accounts are pre-configured in the bootstrap seeding script with the standard test password:

| Role | Username | Email | Password | Primary Workspace |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student_user` | `student@test.com` | `Password123!` | `/student` (Learning Dashboard) |
| **Instructor** | `instructor_user` | `instructor@test.com` | `Password123!` | `/instructor/courses` (Course Studio) |
| **Content Manager** | `manager_user` | `manager@test.com` | `Password123!` | `/content-manager/blog` (Editorial Studio) |
| **Admin** | `admin_user` | `admin@test.com` | `Password123!` | `/admin` (Platform Governance) |

> **Note**: The login screen (`/login`) includes **1-Click Quick Fill Demo Buttons** for instant access without manual typing.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, React Markdown |
| **Backend** | Strapi v5 (Headless CMS), Node.js, TypeScript, SQLite (`.tmp/data.db`) |
| **Authentication** | JWT, bcrypt, Cookie synchronization (`js-cookie`), Edge Middleware |
| **Networking** | Axios Singleton with recursive Strapi v5 data normalizer and query interceptors |

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v20+ LTS recommended
- **NPM**: v10+

### 1. Backend (Strapi v5) Setup
```bash
cd backend
npm install
npm run develop
```
- Strapi will boot at `http://localhost:1337`.
- The bootstrap engine in `backend/src/index.ts` will automatically configure RBAC permissions and seed all initial courses, lessons, quizzes, users, and blogs on first launch.
- Admin panel is accessible at `http://localhost:1337/admin`.

### 2. Frontend (Next.js 16) Setup
```bash
cd frontend
npm install
npm run dev
```
- The Next.js frontend will run at `http://localhost:3000`.

### Environment Configuration

Create or verify `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:1337/api
```

Create or verify `backend/.env`:
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=toBeModified1,toBeModified2
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
TRANSFER_TOKEN_SALT=tobemodified
JWT_SECRET=tobemodified
```

---

## Application Route Directory (27 Verified Routes)

All routes are fully functional and return `200 OK`:

### Public Experience
- `/`: Landing page with hero, live metrics, featured courses, and platform pillars.
- `/courses`: Complete course catalog with real-time keyword search.
- `/courses/[id]`: Course detail and syllabus overview with enrollment triggers.
- `/blog`: Engineering publications with category and author tags.
- `/blog/[id]`: Full article reader with estimated read time and course recommendations.
- `/about`: Company story, engineering values, and executive team cards.
- `/pricing`: Tiered plans (Community Free, Pro Engineer, Enterprise Teams) with interactive checklists.
- `/faq`: Interactive accordion addressing grading, certificates, and subscriptions.
- `/contact`: Support channels and interactive inquiry dispatch form.
- `/terms`: Terms of Service compliance documentation.
- `/privacy`: Privacy & data protection policy.

### Authentication & User Suite
- `/login`: Sign-in interface with 1-click demo filler buttons.
- `/register`: User registration locked to `Student` role type.
- `/profile`: User management suite (Enrolled Courses, Account Overview, Password Update).
- `/dashboard`: Universal switchboard router redirecting users to their role workspace.

### Student Learning Portal
- `/student`: Student dashboard showing active enrollments and progress.
- `/student/courses/[courseId]`: Immersive course player with video viewport and curriculum sidebar.
- `/student/courses/[courseId]/quizzes/[quizId]`: Interactive server-evaluated quiz player.

### Instructor Studio
- `/instructor/courses`: Course registry with module counts and delete triggers.
- `/instructor/courses/new`: Masterclass creation builder.
- `/instructor/courses/[id]`: Course module manager with inline lesson builder and quiz creator.
- `/instructor/progress`: Enrolled student progress and roster monitoring.

### Content Manager Studio
- `/content-manager/blog`: Editorial publication studio with live draft/publish status pills.
- `/content-manager/blog/new`: Markdown article authoring editor.
- `/content-manager/blog/[id]`: Interactive article editor with draft/publish toggling.
- `/content-manager/courses`: Course content and curriculum inspection library.

### Administrative Governance
- `/admin`: Platform metrics overview (Total Users, Courses, Enrollments, Lessons).
- `/admin/users`: User management table with live role-switch dropdowns.
- `/admin/courses`: Platform course moderation registry with live syllabus links.
- `/admin/blog`: Article publication moderation console.

---

## Security & API Guardrails

1. **Anti-Cheat Grading**: Correct quiz answers (`correctAnswer`) are never sent in student payloads. The backend evaluates submissions server-side via `POST /api/quizzes/:id/submit`.
2. **Idempotent Enrollments**: `POST /api/enrollments` prevents duplicate database rows, returning `400 Bad Request` if already enrolled.
3. **Data Isolation**: `GET /api/enrollments` and `GET /api/progresses` filter queries by authenticated student ID. Instructors can only view enrollments for courses they author.
4. **Edge Route Protection**: `middleware.ts` intercepts unauthorized role navigation before page rendering, preventing UI flashing.

---

## Documentation Resources

- [30-Phase Master Blueprint & Execution Summary](docs/phase_summary.md)
- [Comprehensive Milestone & Architecture Summary](docs/milestone_summary.md)
