# LMS Platform - Junior Software Engineer Assessment

This repository contains the complete Learning Management System built for the project assessment. It strictly adheres to the Next.js (Frontend) and Strapi (Backend) stack requirements, with strict Role-Based Access Control (RBAC).

## Features Completed

✅ **Core Features:**
- **Authentication & RBAC:** 4 distinct roles (Admin, Content Manager, Instructor, Student) with deep server-side controller overrides preventing cross-tenant data mutation. Edge middleware protects frontend routes.
- **Course Management:** Instructors manage their *own* courses; Content Managers manage all.
- **Course Enrollment:** Idempotent, server-side duplicate-checked enrollment system for students.
- **Lesson Viewing:** Immersive course player with sidebar navigation and markdown/video support.

🌟 **Differentiator Features:**
- **Progress Tracking:** Atomic upsert completion toggles with a dynamic server-side percentage calculator.
- **Quiz with Auto-Grading:** Server-side evaluation engine. Client sends answers, server computes score and stores immutable receipts to prevent DevTools cheating.
- **Admin Panel:** Custom backend endpoints delivering platform statistics and secure role-promotion mutation capabilities.
- **Blog System:** Draft vs. Published states utilizing Strapi's native publication lifecycle, tightly scoped to Content Managers and Admins.

---

## How to Run Locally

### Prerequisites
- Node.js (v20 LTS recommended)
- NPM

### 1. Backend (Strapi) Setup
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
npm run develop
```
Note: The local backend uses SQLite. On first run, a bootstrap script will automatically seed the 4 required roles (Admin, Content Manager, Instructor, Student).

### 2. Frontend (Next.js) Setup
Open a second terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```
Ensure you have a `.env.local` file in the frontend root with:
```env
NEXT_PUBLIC_API_URL=http://localhost:1337/api
```
Run the development server:
```bash
npm run dev
```
Access the application at http://localhost:3000.
