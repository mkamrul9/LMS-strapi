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
      await enablePermission(studentRole.id, 'api::lesson.lesson.find');
      await enablePermission(studentRole.id, 'api::lesson.lesson.findOne');
      await enablePermission(studentRole.id, 'api::enrollment.enrollment.create');
      await enablePermission(studentRole.id, 'api::enrollment.enrollment.find');
      await enablePermission(studentRole.id, 'api::progress.progress.create');
      await enablePermission(studentRole.id, 'api::progress.progress.find');
      await enablePermission(studentRole.id, 'api::progress.progress.getCoursePercentage');
      await enablePermission(studentRole.id, 'api::quiz.quiz.submit');
      await enablePermission(studentRole.id, 'api::quiz.quiz.find');
      await enablePermission(studentRole.id, 'api::quiz.quiz.findOne');
      await enablePermission(studentRole.id, 'api::quiz-submission.quiz-submission.find');
      await enablePermission(studentRole.id, 'api::quiz-submission.quiz-submission.findOne');
    }

    // INSTRUCTOR ROLE Permissions
    if (instructorRole) {
      const instructorActions = [
        'api::course.course.find', 'api::course.course.findOne', 'api::course.course.create', 'api::course.course.update', 'api::course.course.delete', 'api::course.course.publish', 'api::course.course.unpublish',
        'api::lesson.lesson.find', 'api::lesson.lesson.findOne', 'api::lesson.lesson.create', 'api::lesson.lesson.update', 'api::lesson.lesson.delete', 'api::lesson.lesson.publish', 'api::lesson.lesson.unpublish',
        'api::quiz.quiz.find', 'api::quiz.quiz.findOne', 'api::quiz.quiz.create', 'api::quiz.quiz.update', 'api::quiz.quiz.delete', 'api::quiz.quiz.publish', 'api::quiz.quiz.unpublish',
        'api::quiz-submission.quiz-submission.find', 'api::quiz-submission.quiz-submission.findOne',
        'api::enrollment.enrollment.find', 'api::progress.progress.find',
      ];
      for (const act of instructorActions) {
        await enablePermission(instructorRole.id, act);
      }
    }

    // CONTENT MANAGER ROLE Permissions
    if (managerRole) {
      const managerActions = [
        'api::blog.blog.find', 'api::blog.blog.findOne', 'api::blog.blog.create', 'api::blog.blog.update', 'api::blog.blog.delete', 'api::blog.blog.publish', 'api::blog.blog.unpublish',
        'api::course.course.find', 'api::course.course.findOne', 'api::course.course.create', 'api::course.course.update', 'api::course.course.delete', 'api::course.course.publish', 'api::course.course.unpublish',
        'api::lesson.lesson.find', 'api::lesson.lesson.findOne', 'api::lesson.lesson.create', 'api::lesson.lesson.update', 'api::lesson.lesson.delete', 'api::lesson.lesson.publish', 'api::lesson.lesson.unpublish',
        'api::quiz.quiz.find', 'api::quiz.quiz.findOne', 'api::quiz.quiz.create', 'api::quiz.quiz.update', 'api::quiz.quiz.delete', 'api::quiz.quiz.publish', 'api::quiz.quiz.unpublish',
      ];
      for (const act of managerActions) {
        await enablePermission(managerRole.id, act);
      }
    }

    // ADMIN ROLE Permissions (Full Platform Governance)
    if (adminRole) {
      const adminActions = [
        'api::admin-dashboard.admin-dashboard.getStats',
        'api::admin-dashboard.admin-dashboard.getUsers',
        'api::admin-dashboard.admin-dashboard.updateUserRole',
        'api::course.course.find', 'api::course.course.findOne', 'api::course.course.create', 'api::course.course.update', 'api::course.course.delete', 'api::course.course.publish', 'api::course.course.unpublish',
        'api::lesson.lesson.find', 'api::lesson.lesson.findOne', 'api::lesson.lesson.create', 'api::lesson.lesson.update', 'api::lesson.lesson.delete', 'api::lesson.lesson.publish', 'api::lesson.lesson.unpublish',
        'api::quiz.quiz.find', 'api::quiz.quiz.findOne', 'api::quiz.quiz.create', 'api::quiz.quiz.update', 'api::quiz.quiz.delete', 'api::quiz.quiz.publish', 'api::quiz.quiz.unpublish',
        'api::quiz-submission.quiz-submission.find', 'api::quiz-submission.quiz-submission.findOne',
        'api::blog.blog.find', 'api::blog.blog.findOne', 'api::blog.blog.create', 'api::blog.blog.update', 'api::blog.blog.delete', 'api::blog.blog.publish', 'api::blog.blog.unpublish',
        'api::enrollment.enrollment.find', 'api::enrollment.enrollment.delete',
        'api::progress.progress.find', 'api::progress.progress.getCoursePercentage',
      ];
      for (const act of adminActions) {
        await enablePermission(adminRole.id, act);
      }
    }

    // =========================================================================
    // 4. USER & CONTENT SEEDING ENGINE
    // =========================================================================
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
        let userRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: {
            $or: [
              { email: u.email },
              { username: u.username }
            ]
          }
        });

        if (!userRecord) {
          userRecord = await strapi.db.query('plugin::users-permissions.user').create({
            data: {
              username: u.username,
              email: u.email,
              password: hashedPassword,
              confirmed: true,
              blocked: false,
              provider: 'local',
              role: role.id,
            }
          });
          try {
            await strapi.entityService.update('plugin::users-permissions.user', userRecord.id, {
              data: { role: role.id, confirmed: true, blocked: false }
            });
          } catch (e) {}
        } else {
          // Always ensure password, role, and confirmed status are active
          await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: userRecord.id },
            data: {
              password: hashedPassword,
              role: role.id,
              confirmed: true,
              blocked: false,
            }
          });
          try {
            await strapi.entityService.update('plugin::users-permissions.user', userRecord.id, {
              data: { role: role.id, confirmed: true, blocked: false }
            });
          } catch (e) {}
        }
        createdUsers[u.roleName] = userRecord;
      }
    }
    strapi.log.info('[SUCCESS] Verified & Seeded 4 Primary Users (Password123!)');

    // B. Check if Courses need seeding
    const courseCount = await strapi.query('api::course.course').count();
    if (courseCount === 0 && createdUsers['Instructor']) {
      strapi.log.info('[SEED] Empty course catalog detected. Seeding 6 Masterclasses and curriculum...');
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

        // D. Create Comprehensive Quizzes for all Courses
        const quizzesToSeed = [
          {
            courseId: course1.id,
            title: 'Next.js 19 Architecture & Server Actions Assessment',
            questions: [
              {
                questionText: 'Which Next.js cache layer persists fetch requests across multiple user requests on the server?',
                options: ['Request Memoization', 'Data Cache', 'Router Cache', 'Full Route Cache'],
                correctAnswer: 'Data Cache',
              },
              {
                questionText: 'What directive marks an asynchronous function as a Server Action in React 19 / Next.js?',
                options: ['use client', 'use server', 'use action', 'use mutation'],
                correctAnswer: 'use server',
              },
              {
                questionText: 'Where does Next.js Edge Middleware execute in the request lifecycle?',
                options: [
                  'At the database layer after query execution',
                  'At global edge compute locations before request resolution',
                  'Exclusively in the client browser runtime',
                  'Only during build time static site generation'
                ],
                correctAnswer: 'At global edge compute locations before request resolution',
              }
            ]
          },
          {
            courseId: course2.id,
            title: 'PostgreSQL Architecture & Query Optimization Assessment',
            questions: [
              {
                questionText: 'Which index structure in PostgreSQL is optimal for standard equality (=) and range (<, >, BETWEEN) lookups?',
                options: ['B-Tree', 'GIN (Generalized Inverted Index)', 'BRIN (Block Range Index)', 'Hash Index'],
                correctAnswer: 'B-Tree',
              },
              {
                questionText: 'Which SQL transaction isolation level guarantees complete protection against dirty reads, non-repeatable reads, and phantom reads?',
                options: ['Read Committed', 'Read Uncommitted', 'Repeatable Read', 'Serializable'],
                correctAnswer: 'Serializable',
              },
              {
                questionText: 'What connection pooling tool is standardly deployed in front of PostgreSQL to handle thousands of concurrent client connections?',
                options: ['PgBouncer', 'Redis', 'Memcached', 'Kafka'],
                correctAnswer: 'PgBouncer',
              }
            ]
          },
          {
            courseId: course3.id,
            title: 'Applied AI & Vector Embeddings Assessment',
            questions: [
              {
                questionText: 'Which distance metric evaluates the angular orientation between two high-dimensional embedding vectors regardless of their magnitude?',
                options: ['Euclidean Distance (L2)', 'Cosine Similarity', 'Manhattan Distance (L1)', 'Hamming Distance'],
                correctAnswer: 'Cosine Similarity',
              },
              {
                questionText: 'What is the primary architectural goal of Retrieval-Augmented Generation (RAG)?',
                options: [
                  'Fine-tuning the underlying transformer weights permanently',
                  'Augmenting LLM context with relevant external domain data at query time',
                  'Compressing vector dimensions for faster disk storage',
                  'Replacing all vector databases with traditional SQL tables'
                ],
                correctAnswer: 'Augmenting LLM context with relevant external domain data at query time',
              },
              {
                questionText: 'Which Python framework is designed for orchestrating stateful multi-actor agent graphs with cyclical loops?',
                options: ['LangGraph', 'Scikit-Learn', 'NumPy', 'Flask'],
                correctAnswer: 'LangGraph',
              }
            ]
          },
          {
            courseId: course4.id,
            title: 'Kubernetes & Cloud Infrastructure Assessment',
            questions: [
              {
                questionText: 'Which core Kubernetes control plane component assigns unscheduled Pods to available worker nodes?',
                options: ['kube-scheduler', 'kube-proxy', 'etcd', 'kubelet'],
                correctAnswer: 'kube-scheduler',
              },
              {
                questionText: 'What declarative Infrastructure-as-Code (IaC) tool uses HashiCorp Configuration Language (HCL)?',
                options: ['Terraform', 'Docker Compose', 'Ansible', 'Puppet'],
                correctAnswer: 'Terraform',
              },
              {
                questionText: 'What Kubernetes resource manages external HTTP/HTTPS routing and TLS termination into cluster services?',
                options: ['Ingress Controller', 'ConfigMap', 'DaemonSet', 'PersistentVolumeClaim'],
                correctAnswer: 'Ingress Controller',
              }
            ]
          },
          {
            courseId: course5.id,
            title: 'Design Systems & Figma Auto-Layout Assessment',
            questions: [
              {
                questionText: 'What Figma layout engine dynamically adjusts padding, spacing, and parent dimensions as inner content changes?',
                options: ['Auto Layout', 'Smart Animate', 'Component Variants', 'Boolean Groups'],
                correctAnswer: 'Auto Layout',
              },
              {
                questionText: 'Under WCAG 2.1 Level AA, what is the minimum required contrast ratio for standard body text?',
                options: ['4.5:1', '3.0:1', '7.0:1', '2.5:1'],
                correctAnswer: '4.5:1',
              }
            ]
          },
          {
            courseId: course6.id,
            title: 'Go Microservices & Concurrency Assessment',
            questions: [
              {
                questionText: 'What keyword spawns a concurrent lightweight goroutine managed by the Go runtime scheduler?',
                options: ['go', 'async', 'spawn', 'thread'],
                correctAnswer: 'go',
              },
              {
                questionText: 'What native Go communication mechanism allows goroutines to safely synchronize and pass values without explicit locks?',
                options: ['Channels', 'Mutexes', 'Atomic Pointers', 'Condition Variables'],
                correctAnswer: 'Channels',
              }
            ]
          }
        ];

        for (const qz of quizzesToSeed) {
          await strapi.entityService.create('api::quiz.quiz', {
            data: {
              title: qz.title,
              course: qz.courseId,
              publishedAt: new Date(),
              questions: qz.questions.map(q => ({
                __component: 'quiz.question',
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
              }))
            }
          });
        }
        strapi.log.info('[SUCCESS] Seeded 6 Comprehensive Quizzes across all Masterclasses');

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

      // Check if Quizzes need standalone seeding for already existing courses
      const existingQuizCount = await strapi.query('api::quiz.quiz').count();
      if (existingQuizCount === 0) {
        const existingCourses = await strapi.db.query('api::course.course').findMany();
        if (existingCourses && existingCourses.length > 0) {
          strapi.log.info('[SEED] No quizzes found in catalog. Seeding quizzes for existing courses...');
          const sampleQuizTemplates = [
            {
              title: 'Architecture & Engineering Assessment',
              questions: [
                {
                  questionText: 'Which architectural pattern decouples client requests from long-running background tasks?',
                  options: ['Message Queues & Event-Driven Workers', 'Synchronous Blocking HTTP Calls', 'Client-side Polling with No Timeout', 'Direct Database Mutation in UI Components'],
                  correctAnswer: 'Message Queues & Event-Driven Workers',
                },
                {
                  questionText: 'What is the primary benefit of deploying services across multiple availability zones (Multi-AZ)?',
                  options: ['High Availability & Fault Tolerance', 'Lowering Monthly Server Bandwidth Costs', 'Eliminating the need for unit testing', 'Automatic Database Schema Generation'],
                  correctAnswer: 'High Availability & Fault Tolerance',
                },
                {
                  questionText: 'Which HTTP status code indicates a successful idempotent resource retrieval?',
                  options: ['200 OK', '404 Not Found', '500 Internal Error', '301 Moved Permanently'],
                  correctAnswer: '200 OK',
                }
              ]
            }
          ];

          for (const courseItem of existingCourses) {
            const tmpl = sampleQuizTemplates[0];
            await strapi.entityService.create('api::quiz.quiz', {
              data: {
                title: `${courseItem.title} Assessment`,
                course: courseItem.id,
                publishedAt: new Date(),
                questions: tmpl.questions.map(q => ({
                  __component: 'quiz.question',
                  questionText: q.questionText,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                }))
              }
            });
          }
          strapi.log.info(`[SUCCESS] Seeded Quizzes for all ${existingCourses.length} existing masterclasses`);
        }
      }

      // Repair empty quizzes
      const allQuizzes = await strapi.db.query('api::quiz.quiz').findMany({
        populate: ['questions']
      });
      for (const quiz of allQuizzes) {
        if (!quiz.questions || quiz.questions.length === 0) {
          strapi.log.info(`[REPAIR] Fixing empty quiz: ${quiz.title}`);
          await strapi.entityService.update('api::quiz.quiz', quiz.id, {
            data: {
              questions: [
                {
                  __component: 'quiz.question',
                  questionText: 'Which architectural pattern decouples client requests from long-running background tasks?',
                  options: ['Message Queues & Event-Driven Workers', 'Synchronous Blocking HTTP Calls', 'Client-side Polling with No Timeout', 'Direct Database Mutation in UI Components'],
                  correctAnswer: 'Message Queues & Event-Driven Workers',
                },
                {
                  __component: 'quiz.question',
                  questionText: 'What is the primary benefit of deploying services across multiple availability zones (Multi-AZ)?',
                  options: ['High Availability & Fault Tolerance', 'Lowering Monthly Server Bandwidth Costs', 'Eliminating the need for unit testing', 'Automatic Database Schema Generation'],
                  correctAnswer: 'High Availability & Fault Tolerance',
                }
              ]
            }
          });
        }
      }

      strapi.log.info('[SUCCESS] Database Seeding & Verification Complete!');
  },
};
