// @ts-nocheck
import { factories } from '@strapi/strapi';

/**
 * Custom Enrollment Controller
 * 
 * Overrides Strapi's default core controller for the Enrollment content-type to introduce
 * strict business logic: Idempotency (preventing duplicate enrollments) and Role-Based Access Control.
 * Only Students can enroll in courses.
 */
export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  
  /**
   * Overrides the default POST /api/enrollments endpoint.
   * Locked exclusively to the Student role.
   */
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to enroll.');

    // 1. Payload Validation
    const courseId = ctx.request.body.data?.course;
    if (!courseId) {
      return ctx.badRequest('A valid course ID is required for enrollment.');
    }

    // 2. Strict Role Verification: ONLY Students can enroll
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser?.role?.name !== 'Student') {
      return ctx.forbidden('Access denied. Only Students can enroll in courses.');
    }

    // 3. Resolve numeric ID if documentId was passed
    let numericCourseId = courseId;
    if (typeof courseId === 'string' && !/^\d+$/.test(courseId)) {
      const courseObj = await strapi.db.query('api::course.course').findOne({
        where: { documentId: courseId },
      });
      if (courseObj) numericCourseId = courseObj.id;
    } else {
      numericCourseId = parseInt(courseId, 10);
    }

    // 4. Idempotency Check (Duplicate Enrollment Prevention)
    const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: {
        student: user.id,
        course: numericCourseId,
      },
    });

    if (existingEnrollment) {
      return ctx.badRequest('You are already enrolled in this course.');
    }

    // 5. Create Enrollment directly with relations
    const newEnrollment = await strapi.entityService.create('api::enrollment.enrollment', {
      data: {
        student: user.id,
        course: numericCourseId,
        enrolledAt: new Date(),
        publishedAt: new Date(),
      },
      populate: ['course', 'student'],
    });

    return { data: newEnrollment };
  },

  /**
   * Overrides the default GET /api/enrollments endpoint.
   * Introduces multi-tenant data isolation logic based on the requester's role.
   */
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    const isStudent = fullUser?.role?.name === 'Student';
    const isInstructor = fullUser?.role?.name === 'Instructor';
    const isAdmin = fullUser?.role?.name === 'Admin';

    if (isStudent) {
      const studentEnrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        where: { student: user.id },
        populate: {
          course: {
            populate: ['instructor'],
          },
          student: true,
        },
      });
      return { data: studentEnrollments };
    }

    if (isInstructor) {
      const allEnrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        populate: {
          course: {
            populate: ['instructor'],
          },
          student: true,
        },
      });
      const instructorEnrollments = allEnrollments.filter(
        (enr) => enr.course?.instructor?.id === user.id || enr.course?.instructor?.documentId === user.documentId
      );
      return { data: instructorEnrollments };
    }

    if (isAdmin) {
      const allEnrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
        populate: {
          course: {
            populate: ['instructor'],
          },
          student: true,
        },
      });
      return { data: allEnrollments };
    }

    return { data: [] };
  }
}));
