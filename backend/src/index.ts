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

    for (const roleId of [publicRole?.id, studentRole?.id].filter(Boolean)) {
      await enablePermission(roleId, 'api::course.course.find');
      await enablePermission(roleId, 'api::course.course.findOne');
      await enablePermission(roleId, 'api::blog.blog.find');
      await enablePermission(roleId, 'api::blog.blog.findOne');
    }

    if (studentRole) {
      await enablePermission(studentRole.id, 'api::enrollment.enrollment.create');
      await enablePermission(studentRole.id, 'api::enrollment.enrollment.find');
      await enablePermission(studentRole.id, 'api::progress.progress.create');
      await enablePermission(studentRole.id, 'api::progress.progress.find');
      await enablePermission(studentRole.id, 'api::progress.progress.getCoursePercentage');
      await enablePermission(studentRole.id, 'api::quiz.quiz.submit');
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
          createdUsers[u.roleName] = newUser;
        }
      }
      strapi.log.info('✅ Seeded 4 Primary Users (Password123!)');

      // B. Create Courses (Assigned to Instructor)
      if (createdUsers['Instructor']) {
        const course1 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Advanced Next.js Architecture',
            description: 'Master the App Router, Server Actions, and Edge Middleware.',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });

        const course2 = await strapi.entityService.create('api::course.course', {
          data: {
            title: 'Mastering PostgreSQL',
            description: 'Deep dive into relational data modeling and performance tuning.',
            instructor: createdUsers['Instructor'].id,
            publishedAt: new Date(),
          }
        });
        strapi.log.info('✅ Seeded 2 Courses');

        // C. Create Lessons for Course 1
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: 'Introduction to App Router', content: 'Welcome to the Next.js App Router paradigm.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order: 1, course: course1.id, publishedAt: new Date() }
        });
        const targetLesson = await strapi.entityService.create('api::lesson.lesson', {
          data: { title: 'Server Components Deep Dive', content: 'RSC allows you to keep large dependencies on the server.', order: 2, course: course1.id, publishedAt: new Date() }
        });

        // Create Lessons for Course 2
        await strapi.entityService.create('api::lesson.lesson', {
          data: { title: 'ACID Properties', content: 'Atomicity, Consistency, Isolation, Durability.', order: 1, course: course2.id, publishedAt: new Date() }
        });
        strapi.log.info('✅ Seeded 3 Lessons');

        // D. Create Quiz for Course 1
        const quiz1 = await strapi.entityService.create('api::quiz.quiz', {
          data: {
            title: 'Next.js Foundations Quiz',
            course: course1.id,
            publishedAt: new Date(),
          }
        });

        // Add Questions to Quiz 1
        await strapi.entityService.update('api::quiz.quiz', quiz1.id, {
          data: {
            questions: [
              {
                __component: 'quiz.question',
                questionText: 'What does RSC stand for?',
                options: [
                  { id: 'A', text: 'React Server Components' },
                  { id: 'B', text: 'React State Control' },
                  { id: 'C', text: 'Realtime Server Cache' },
                  { id: 'D', text: 'React System Config' }
                ],
                correctAnswer: 'A'
              },
              {
                __component: 'quiz.question',
                questionText: 'Which file defines a layout in App Router?',
                options: [
                  { id: 'A', text: 'page.tsx' },
                  { id: 'B', text: 'layout.tsx' },
                  { id: 'C', text: '_app.tsx' },
                  { id: 'D', text: 'index.tsx' }
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
          strapi.log.info('✅ Seeded Student Enrollment and Progress Tracking');
        }
      }

      // F. Create Blog Posts (Assigned to Content Manager)
      if (createdUsers['Content Manager']) {
        await strapi.entityService.create('api::blog.blog', {
          data: {
            title: 'Welcome to the New LMS Platform!',
            content: 'We are thrilled to announce the launch of our new learning platform. Enjoy the courses!',
            author: createdUsers['Content Manager'].id,
            publishedAt: new Date(),
          }
        });

        await strapi.entityService.create('api::blog.blog', {
          data: {
            title: 'Draft Post: Upcoming Features',
            content: 'This post is a draft and should not be visible to public users.',
            author: createdUsers['Content Manager'].id,
            publishedAt: null, // Draft state
          }
        });
        strapi.log.info('✅ Seeded 2 Blog Posts (1 Published, 1 Draft)');
      }

      strapi.log.info('🎉 Database Seeding Complete!');
    }
  },
};
