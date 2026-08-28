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
    // Retrieve the full user object including relational role data.
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    // Enforce that only valid Students (and Admins for testing/override) can trigger an enrollment.
    if (fullUser.role.name !== 'Student' && fullUser.role.name !== 'Admin') {
      return ctx.forbidden('Only Students can enroll in courses.');
    }

    // 3. Idempotency Check (Duplicate Enrollment Prevention)
    // Query the database to see if this exact student is already linked to this exact course.
    const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: {
        student: user.id,
        course: courseId,
      },
    });

    if (existingEnrollment) {
      return ctx.badRequest('You are already enrolled in this course.');
    }

    // 4. Payload Sanitization
    // We forcibly overwrite the `student` relational field with the token's authenticated User ID.
    // This prevents malicious actors from spoofing enrollments for other users via the API.
    ctx.request.body.data.student = user.id;

    // 5. Execution
    // Pass the sanitized and validated context down to Strapi's default create method.
    return await super.create(ctx);
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

    // 6. Data Isolation
    // If the user is a Student, we silently force a filter into their query parameters.
    // They will only ever receive enrollments where they are the assigned student, regardless
    // of what query parameters they attempt to pass in the URL.
    if (fullUser.role.name === 'Student') {
      ctx.query.filters = {
        ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
        student: user.id,
      };
    }
    // Note: Admins, Content Managers, and Instructors bypass this filter and receive
    // the globally requested subset of enrollments based on standard query params.

    return await super.find(ctx);
  }
}));
