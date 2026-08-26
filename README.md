# LMS Platform

A production-grade Learning Management System (LMS) built from scratch using a modern tech stack (Next.js + Strapi). This platform strictly enforces a 4-tier Role-Based Access Control (RBAC) matrix and features a highly secure backend API engine with dynamic data isolation, auto-grading, and Edge-level frontend security.

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router), React, TailwindCSS, TypeScript, shadcn/ui
- **Backend:** Strapi v5, SQLite (Local Development)
- **Architecture:** Monorepo (`/frontend` and `/backend`)

## 🔐 Core Features & Architecture

### 1. Robust Role-Based Access Control (RBAC)
The system strictly supports four distinct roles:
- **Admin**: Full platform access, complete UI bypass logic.
- **Content Manager**: Can manage all courses and content but cannot alter core settings or blogs they don't own.
- **Instructor**: Can only create, update, and manage the courses/lessons/quizzes they own.
- **Student**: Can only view courses, enroll, track progress, and take quizzes.

### 2. Bulletproof Backend Security & Data Isolation
Unlike standard CMS implementations, the Strapi backend has been deeply customized to prevent manipulation via API endpoint spoofing:
- **Idempotent Enrollments**: Pre-flight duplicate checks block race-condition enrollments.
- **Tenant Data Isolation**: Students can strictly only query their own enrollments, progress, and grades.
- **Blind Auto-Grading Engine**: Quiz evaluation runs completely server-side. Correct answers are never sent to the client, preventing browser network tampering.
- **Deep Ownership Validation**: Instructors can only modify nested content (Lessons/Quizzes) if they own the parent Course.

### 3. Edge-Level Frontend Protection
The Next.js App Router utilizes a multi-layered security mechanism:
- **Cookie-Based JWT Sync**: Authentication state is stored safely in browser cookies, allowing for instantaneous Server-Side and Client-Side hydration.
- **Next.js Middleware Interceptors**: A blazing-fast Edge Middleware intercepts all private URL requests. It enforces strict role boundaries and instantly blocks/redirects users attempting to access dashboards outside their permission scope (e.g. Students attempting to hit `/admin`), without ever fetching from the database.
- **Dynamic Portal Switchboards**: Centralized routing components (`/dashboard`) automatically direct users to their exact portal based on their active role.

## 📖 Documentation
Detailed architectural explanations and progress tracking can be found in the `/docs` directory (ignored by git to keep production clean, but contains the project history):
- `phase_summary.md`: Detailed tracker of the 30-phase blueprint.
- `milestone_summary.md`: In-depth breakdown of the technical decisions for each phase.

## 💻 Getting Started (Local Development)

### Prerequisites
- **Node.js**: v20.x

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Strapi development server:
   ```bash
   npm run develop
   ```
*(Note: On the very first start, a bootstrap script automatically seeds the database with the custom Roles. Create your first Admin user via `http://localhost:1337/admin`).*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
*(The frontend will be available at `http://localhost:3000`).*
