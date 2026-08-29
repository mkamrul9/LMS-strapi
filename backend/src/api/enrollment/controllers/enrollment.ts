// @ts-nocheck
import { factories } from '@strapi/strapi';

/**
 * Custom Enrollment Controller
 * 
 * Overrides Strapi's default core controller for the Enrollment content-type to introduce
 * strict business logic: Idempotency (preventing duplicate enrollments) and Role-Based Access Control.
 */
export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  
  /**
   * Overrides the default POST /api/enrollments endpoint.
   * 
   * @param {object} ctx - Koa context object containing the request payload and authenticated user state.
   */
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to enroll.');

    // 1. Payload Validation
    const courseId = ctx.request.body.data?.course;
    if (!courseId) {
      return ctx.badRequest('A valid course ID is required for enrollment.');
    }

    // 2. Role Verification
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    // Enforce that only valid Students (and Admins for testing/override) can trigger an enrollment.
    if (fullUser.role?.name !== 'Student' && fullUser.role?.name !== 'Admin') {
      return ctx.forbidden('Only Students can enroll in courses.');
    }

    // 3. Idempotency Check (Duplicate Enrollment Prevention)
    const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: {
        student: user.id,
        course: courseId,
      },
    });

    if (existingEnrollment) {
      return ctx.badRequest('You are already enrolled in this course.');
    }

    // 4. Create Enrollment directly with relations
    const newEnrollment = await strapi.entityService.create('api::enrollment.enrollment', {
      data: {
        student: user.id,
        course: courseId,
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
    const studentFilter = isStudent ? { student: user.id } : {};

    const enrollments = await strapi.db.query('api::enrollment.enrollment').findMany({
      where: studentFilter,
      populate: {
        course: {
          populate: ['instructor'],
        },
        student: true,
      },
    });

    return { data: enrollments };
  }
}));
