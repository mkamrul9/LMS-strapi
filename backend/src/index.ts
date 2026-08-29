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
        strapi.log.info(`✅ Seeded Role: ${roleName}`);
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
      strapi.log.info(`✅ Default registration role securely locked to type: ${targetRoleType}`);
    } catch (error) {
      strapi.log.error(`❌ Failed to set default role: ${error.message}`);
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
      strapi.log.info('🔄 Empty database detected. Initiating Full Content Seed Engine...');

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
      strapi.log.info('✅ Seeded 4 Primary Users (Password123!)');

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
            description: 'Learn practical neural networks, LLM fine-tuning, embeddings, and LangChain agents from scratch.',
            coverImageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course4 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Cloud Infrastructure & Kubernetes on AWS',
            description: 'Deploy resilient containerized workloads using Docker, Terraform, Helm, and production EKS clusters.',
            coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course5 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Modern UI/UX Design Systems in Figma',
            description: 'Design accessible, scalable design tokens, component variants, and interactive micro-animations for enterprise products.',
            coverImageUrl: 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course6 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Cross-Platform Mobile Apps with React Native',
            description: 'Build native iOS and Android apps with Expo Router, gesture handlers, camera APIs, and offline sync.',
            coverImageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });
        strapi.log.info('✅ Seeded 6 Comprehensive Courses');

        // C. Create Lessons for Courses
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '1. Introduction to Next.js App Router', content: 'Welcome to the paradigm shift of Server-First React applications.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course1.id, publishedAt: new Date() }
        });
        const targetLesson = await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '2. React Server Components & Streaming', content: 'RSC allows zero-bundle-size React components and progressive hydration.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 2, course: course1.id, publishedAt: new Date() }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '3. Edge Middleware & Dynamic Routing', content: 'Execute logic before a request is completed using lightweight V8 runtimes.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 3, course: course1.id, publishedAt: new Date() }
        });

        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '1. Relational Database Modeling', content: 'Designing 3NF schemas and defining foreign key constraints.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course2.id, publishedAt: new Date() }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '2. Indexing Strategies & Query Planner', content: 'B-tree, GIN, and GiST indexes with EXPLAIN ANALYZE.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 2, course: course2.id, publishedAt: new Date() }
        });

        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '1. Vector Embeddings and Semantic Search', content: 'Transforming text into high-dimensional geometric spaces.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course3.id, publishedAt: new Date() }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '1. Kubernetes Architecture & Pod Lifecycle', content: 'Understanding Control Plane, Kubelet, and declarative manifests.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course4.id, publishedAt: new Date() }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '1. Typography and Dynamic Spacing Grids', content: 'Establishing consistent 8pt spatial rhythm in Figma.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course5.id, publishedAt: new Date() }
        });
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: '1. Native Navigation and Safe Areas', content: 'Building smooth mobile stack navigation on iOS and Android.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course6.id, publishedAt: new Date() }
        });
        strapi.log.info('✅ Seeded 9 Curriculum Lessons');

        // D. Create Interactive Quiz for Course 1
        const quiz1 = await strapi.entityService.create('api::quiz.quiz', {
          data: {
            title: 'Next.js Foundations & Server Architecture Quiz',
            course: course1.id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.update('api::quiz.quiz', quiz1.id, {
          data: {
            questions: [
              {
                __component: 'quiz.question',
                questionText: 'What is the primary benefit of React Server Components (RSC)?',
                options: [
                  { id: 'A', text: 'Zero client-side JavaScript bundle overhead for static logic' },
                  { id: 'B', text: 'Automatic WebSocket client sync' },
                  { id: 'C', text: 'Forced re-rendering of entire DOM tree' },
                  { id: 'D', text: 'Client-only LocalStorage binding' }
                ],
                correctAnswer: 'A'
              },
              {
                __component: 'quiz.question',
                questionText: 'Which file convention defines the UI shell layout in App Router?',
                options: [
                  { id: 'A', text: 'page.tsx' },
                  { id: 'B', text: 'layout.tsx' },
                  { id: 'C', text: '_app.tsx' },
                  { id: 'D', text: 'index.tsx' }
                ],
                correctAnswer: 'B'
              },
              {
                __component: 'quiz.question',
                questionText: 'Where does Next.js Edge Middleware execute?',
                options: [
                  { id: 'A', text: 'In the client browser window' },
                  { id: 'B', text: 'On an edge runtime before the request completes' },
                  { id: 'C', text: 'In a SQLite database trigger' },
                  { id: 'D', text: 'Inside the React useEffect hook' }
                ],
                correctAnswer: 'B'
              }
            ]
          }
        });
        strapi.log.info('✅ Seeded Quiz and Questions');

        // E. Auto-enroll the Student in Course 1 for immediate testing
        if (createdUsers['Student']) {
          await strapi.entityService.create('api::enrollment.enrollment', {
            data: {
              student: createdUsers['Student'].id,
              course: course1.id,
              enrolledAt: new Date(),
              publishedAt: new Date()
            }
          });

          await strapi.entityService.create('api::enrollment.enrollment', {
            data: {
              student: createdUsers['Student'].id,
              course: course2.id,
              enrolledAt: new Date(),
              publishedAt: new Date()
            }
          });

          // Pre-complete one lesson so progress bar is > 0
          await strapi.entityService.create('api::progress.progress', {
            data: {
              student: createdUsers['Student'].id,
              lesson: targetLesson.id,
              course: course1.id,
              isCompleted: true,
              publishedAt: new Date()
            }
          });
          strapi.log.info('✅ Seeded Student Enrollments and Progress Tracking');
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
        strapi.log.info('✅ Seeded 4 Blog Posts (3 Published, 1 Draft)');
      }

      strapi.log.info('🎉 Database Seeding Complete!');
    }
  },
};
