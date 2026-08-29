// @ts-nocheck  
import bcrypt from 'bcryptjs';

export default {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    // =========================================================================
    // 1. ROLE SEEDING
    // =========================================================================
    const requiredRoles = ['Admin', 'Content Manager', 'Instructor', 'Student'];
    const roleService = strapi.query('plugin::users-permissions.role');

    // Make sure we have the Public and Authenticated roles pre-fetched
    let publicRole = await roleService.findOne({ where: { type: 'public' } });
    let authRole = await roleService.findOne({ where: { type: 'authenticated' } });

    for (const roleName of requiredRoles) {
      const existingRole = await roleService.findOne({ where: { name: roleName } });
      if (!existingRole) {
        await roleService.create({
          data: {
            name: roleName,
            description: `${roleName} role generated via bootstrap`,
            type: roleName.toLowerCase().replace(' ', '_'),
          },
        });
        strapi.log.info(`[SUCCESS] Seeded Role: ${roleName}`);
      }
    }

    // =========================================================================
    // 2. DEFAULT ROLE CONFIGURATION FIX (Solves "impossible to find the role")
    // =========================================================================
    try {
      const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
      let advancedConfig = await pluginStore.get();
      const studentRole = await roleService.findOne({ where: { name: 'Student' } });
      const targetRoleType = studentRole?.type || 'student';

      if (!advancedConfig) {
        advancedConfig = {
          allow_register: true,
          email_confirmation: false,
          default_role: targetRoleType,
        };
      }

      // In Strapi v5, default_role is queried by `type` (string), NOT numeric ID
      await pluginStore.set({
        value: {
          ...advancedConfig,
          allow_register: true,
          default_role: targetRoleType,
        },
      });
      strapi.log.info(`[SUCCESS] Default registration role securely locked to type: ${targetRoleType}`);
    } catch (error) {
      strapi.log.error(`[ERROR] Failed to set default role: ${error.message}`);
    }

    // =========================================================================
    // 3. PERMISSIONS CONFIGURATION
    // =========================================================================
    const enablePermission = async (roleId, action) => {
      if (!roleId) return;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { role: roleId, action }
      });
      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { role: roleId, action }
        });
      }
    };

    const studentRole = await roleService.findOne({ where: { name: 'Student' } });
    const managerRole = await roleService.findOne({ where: { name: 'Content Manager' } });
    const instructorRole = await roleService.findOne({ where: { name: 'Instructor' } });
    const adminRole = await roleService.findOne({ where: { name: 'Admin' } });

    // PUBLIC ROLE Permissions
    if (publicRole) {
      await enablePermission(publicRole.id, 'plugin::users-permissions.auth.register');
      await enablePermission(publicRole.id, 'plugin::users-permissions.auth.callback');
      await enablePermission(publicRole.id, 'api::course.course.find');
      await enablePermission(publicRole.id, 'api::course.course.findOne');
      await enablePermission(publicRole.id, 'api::blog.blog.find');
      await enablePermission(publicRole.id, 'api::blog.blog.findOne');
    }

    // ALL AUTHENTICATED ROLES get /users/me
    for (const r of [authRole, studentRole, instructorRole, managerRole, adminRole].filter(Boolean)) {
      await enablePermission(r.id, 'plugin::users-permissions.user.me');
      await enablePermission(r.id, 'plugin::users-permissions.auth.callback');
    }

    // STUDENT ROLE Permissions
    if (studentRole) {
      await enablePermission(studentRole.id, 'api::course.course.find');
      await enablePermission(studentRole.id, 'api::course.course.findOne');
      await enablePermission(studentRole.id, 'api::blog.blog.find');
      await enablePermission(studentRole.id, 'api::blog.blog.findOne');
      await enablePermission(studentRole.id, 'api::enrollment.enrollment.create');
      await enablePermission(studentRole.id, 'api::enrollment.enrollment.find');
      await enablePermission(studentRole.id, 'api::progress.progress.create');
      await enablePermission(studentRole.id, 'api::progress.progress.find');
      await enablePermission(studentRole.id, 'api::progress.progress.getCoursePercentage');
      await enablePermission(studentRole.id, 'api::quiz.quiz.submit');
      await enablePermission(studentRole.id, 'api::quiz.quiz.find');
      await enablePermission(studentRole.id, 'api::quiz.quiz.findOne');
    }

    // INSTRUCTOR ROLE Permissions
    if (instructorRole) {
      const instructorActions = [
        'api::course.course.find', 'api::course.course.findOne', 'api::course.course.create', 'api::course.course.update', 'api::course.course.delete',
        'api::lesson.lesson.find', 'api::lesson.lesson.findOne', 'api::lesson.lesson.create', 'api::lesson.lesson.update', 'api::lesson.lesson.delete',
        'api::quiz.quiz.find', 'api::quiz.quiz.findOne', 'api::quiz.quiz.create', 'api::quiz.quiz.update', 'api::quiz.quiz.delete',
        'api::enrollment.enrollment.find', 'api::progress.progress.find',
      ];
      for (const act of instructorActions) {
        await enablePermission(instructorRole.id, act);
      }
    }

    // CONTENT MANAGER ROLE Permissions
    if (managerRole) {
      const managerActions = [
        'api::blog.blog.find', 'api::blog.blog.findOne', 'api::blog.blog.create', 'api::blog.blog.update', 'api::blog.blog.delete',
        'api::course.course.find', 'api::course.course.findOne',
      ];
      for (const act of managerActions) {
        await enablePermission(managerRole.id, act);
      }
    }

    // ADMIN ROLE Permissions
    if (adminRole) {
      const adminActions = [
        'api::admin-dashboard.admin-dashboard.getStats',
        'api::admin-dashboard.admin-dashboard.getUsers',
        'api::admin-dashboard.admin-dashboard.updateUserRole',
        'api::course.course.find', 'api::course.course.findOne', 'api::course.course.create', 'api::course.course.update', 'api::course.course.delete',
        'api::blog.blog.find', 'api::blog.blog.findOne', 'api::blog.blog.create', 'api::blog.blog.update', 'api::blog.blog.delete',
        'api::enrollment.enrollment.find', 'api::enrollment.enrollment.create', 'api::enrollment.enrollment.delete',
        'api::progress.progress.find',
      ];
      for (const act of adminActions) {
        await enablePermission(adminRole.id, act);
      }
    }

    // =========================================================================
    // 4. USER & CONTENT SEEDING ENGINE
    // =========================================================================
    const userCount = await strapi.query('plugin::users-permissions.user').count();
    if (userCount === 0) {
      strapi.log.info('[SEED] Empty database detected. Initiating Full Content Seed Engine...');

      // A. Create Users (Using raw DB query to bypass strict validation in v5 populate)
      const usersToCreate = [
        { username: 'admin_user', email: 'admin@test.com', password: 'Password123!', roleName: 'Admin', confirmed: true },
        { username: 'manager_user', email: 'manager@test.com', password: 'Password123!', roleName: 'Content Manager', confirmed: true },
        { username: 'instructor_user', email: 'instructor@test.com', password: 'Password123!', roleName: 'Instructor', confirmed: true },
        { username: 'student_user', email: 'student@test.com', password: 'Password123!', roleName: 'Student', confirmed: true },
      ];

      const createdUsers = {};
      for (const u of usersToCreate) {
        const role = await roleService.findOne({ where: { name: u.roleName } });
        if (role) {
          const hashedPassword = await bcrypt.hash(u.password, 10);
          const newUser = await strapi.db.query('plugin::users-permissions.user').create({
            data: {
              username: u.username,
              email: u.email,
              password: hashedPassword,
              confirmed: u.confirmed,
              provider: 'local',
              role: role.id,
            }
          });
          try {
            await strapi.entityService.update('plugin::users-permissions.user', newUser.id, {
              data: { role: role.id }
            });
          } catch (e) {}
          createdUsers[u.roleName] = newUser;
        }
      }
      strapi.log.info('[SUCCESS] Seeded 4 Primary Users (Password123!)');

      // B. Create 6 Comprehensive Courses (Assigned to Instructor)
      if (createdUsers['Instructor']) {
        const course1 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Advanced Next.js & React 19 Architecture',
            description: 'Master the App Router, Server Actions, Edge Middleware, and full-stack performance optimization patterns.',
            coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course2 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Mastering PostgreSQL & Database Scaling',
            description: 'Deep dive into relational data modeling, query optimization, indexing strategies, and connection pooling.',
            coverImageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course3 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Applied AI & Machine Learning with Python',
            description: 'Build production-ready LLM pipelines, vector embeddings with Pinecone, and automated agent workflows.',
            coverImageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course4 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Cloud Infrastructure & Kubernetes on AWS',
            description: 'Deploy resilient containerized services using Terraform, AWS EKS, ingress controllers, and CI/CD pipelines.',
            coverImageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course5 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Modern UI/UX Design Systems in Figma',
            description: 'Design accessible, high-converting design systems with auto-layout, token variables, and component variants.',
            coverImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course6 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Cross-Platform Mobile Apps with React Native',
            description: 'Ship native iOS & Android applications with Expo Router, Reanimated, and offline state persistence.',
            coverImageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });
        strapi.log.info('[SUCCESS] Seeded 6 Comprehensive Courses');

        // C. Create Lessons for Course 1
        const lesson1 = await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '1. App Router Fundamentals & Server Components',
            content: 'Deep dive into React Server Components (RSC), streaming HTML, and suspense boundaries.',
            videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
            order: 1,
            course: course1.id,
            publishedAt: new Date(),
          }
        });

        const lesson2 = await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '2. Server Actions, Optimistic UI & Revalidation',
            content: 'Learn mutation patterns using useActionState, useOptimistic, and revalidatePath tags.',
            videoUrl: 'https://www.youtube.com/watch?v=d5x0JCbAakQ',
            order: 2,
            course: course1.id,
            publishedAt: new Date(),
          }
        });

        const lesson3 = await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '3. Production Caching Strategies & Edge Middleware',
            content: 'Master the 4-layer Next.js cache architecture (Request Memoization, Data Cache, Full Route Cache, Router Cache).',
            videoUrl: 'https://www.youtube.com/watch?v=gSSsZReIFRk',
            order: 3,
            course: course1.id,
            publishedAt: new Date(),
          }
        });

        // Lessons for Course 2
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '1. Relational Schema Architecture & Normalization',
            content: 'Third normal form (3NF), foreign key cascading, and domain constraints.',
            order: 1,
            course: course2.id,
            publishedAt: new Date(),
          }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '2. High-Performance B-Tree & GIN Indexing',
            content: 'Explain analyze, query planning, partial indexes, and multi-column composite indexing.',
            order: 2,
            course: course2.id,
            publishedAt: new Date(),
          }
        });

        // Lessons for Course 3
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '1. Embeddings & Vector Database Fundamentals',
            content: 'High-dimensional cosine similarity, chunking strategies, and retrieval augmented generation (RAG).',
            order: 1,
            course: course3.id,
            publishedAt: new Date(),
          }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '2. Building Multi-Agent Orchestrations with LangChain',
            content: 'State machines, tool-calling interfaces, and human-in-the-loop validation checkpoints.',
            order: 2,
            course: course3.id,
            publishedAt: new Date(),
          }
        });

        // Lessons for Course 4
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '1. Kubernetes Architecture & Pod Lifecycle',
            content: 'Control plane internals, kubelet scheduling, and container runtime interfaces.',
            order: 1,
            course: course4.id,
            publishedAt: new Date(),
          }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: {
            title: '2. Ingress Controllers & TLS Termination',
            content: 'NGINX ingress rules, cert-manager automation, and service mesh traffic splitting.',
            order: 2,
            course: course4.id,
            publishedAt: new Date(),
          }
        });
        strapi.log.info('[SUCCESS] Seeded 9 Curriculum Lessons');

        // D. Create Quiz for Course 1
        const quiz1 = await strapi.entityService.create('api::quiz.quiz', {
          data: {
            title: 'Next.js 19 Architecture Assessment',
            course: course1.id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.create('api::question.question', {
          data: {
            questionText: 'Which Next.js cache layer persists fetch requests across multiple user requests on the server?',
            options: ['Request Memoization', 'Data Cache', 'Router Cache', 'Full Route Cache'],
            correctAnswer: 'Data Cache',
            quiz: quiz1.id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.create('api::question.question', {
          data: {
            questionText: 'What directive marks a function as a Server Action in React 19?',
            options: ['use client', 'use server', 'use action', 'use mutation'],
            correctAnswer: 'use server',
            quiz: quiz1.id,
            publishedAt: new Date(),
          }
        });
        strapi.log.info('[SUCCESS] Seeded Quiz and Questions');

        // E. Create Enrollment & Progress for Student
        if (createdUsers['Student']) {
          await strapi.entityService.create('api::enrollment.enrollment', {
            data: {
              student: createdUsers['Student'].id,
              course: course1.id,
              enrolledAt: new Date(),
              publishedAt: new Date()
            }
          });

          // Mark lesson 1 completed for Student
          const targetLesson = lesson1;
          await strapi.entityService.create('api::progress.progress', {
            data: {
              student: createdUsers['Student'].id,
              lesson: targetLesson.id,
              course: course1.id,
              isCompleted: true,
              publishedAt: new Date()
            }
          });
          strapi.log.info('[SUCCESS] Seeded Student Enrollments and Progress Tracking');
        }
      }

      // F. Create 4 Blog Articles (Assigned to Content Manager)
      if (createdUsers['Content Manager']) {
        await strapi.entityService.create('api::blog.blog', {
          data: {
            title: 'Top 10 Modern Fullstack Development Trends for 2026',
            content: `The software engineering landscape is evolving rapidly. Here are the top paradigm shifts driving modern web development this year:\n\n### 1. Server-Driven React & Edge Compute\nRendering at the edge minimizes roundtrips to origin databases.\n\n### 2. Autonomous AI Agents & Embeddings\nVector databases paired with specialized LLMs are automating customer workflows.\n\n### 3. Strict End-to-End Type Safety\nFrom schema to client UI, TypeScript + OpenAPI/tRPC ensures zero runtime mismatch errors.`,
            coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
            author: createdUsers['Content Manager'].id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.create('api::blog.blog', {
          data: {
            title: 'Architecting Resilient Microservices with Kubernetes',
            content: `Container orchestration requires understanding horizontal pod autoscaling, ingress controllers, and zero-downtime rolling deployments.\n\n### Core Best Practices\n- Define explicit resource requests and limits.\n- Implement graceful shutdown listeners.\n- Use readiness and liveness probes correctly.`,
            coverImageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
            author: createdUsers['Content Manager'].id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.create('api::blog.blog', {
          data: {
            title: 'How to Master UI/UX Micro-Interactions in Product Design',
            content: `Micro-interactions transform a static UI into an intuitive tactile experience. Learn how subtle spring physics and easing functions elevate user retention.`,
            coverImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
            author: createdUsers['Content Manager'].id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.create('api::blog.blog', {
          data: {
            title: 'Draft Post: The Future of Quantum Computing in Web3',
            content: 'This post is currently in draft review and showcases Content Manager moderation permissions.',
            coverImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
            author: createdUsers['Content Manager'].id,
            publishedAt: null, // Draft state
          }
        });
        strapi.log.info('[SUCCESS] Seeded 4 Blog Posts (3 Published, 1 Draft)');
      }

      strapi.log.info('[SUCCESS] Database Seeding Complete!');
    }
  },
};
