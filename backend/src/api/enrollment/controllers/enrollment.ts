// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to enroll.');

    // 1. Validate Course ID presence
    const courseId = ctx.request.body.data?.course;
    if (!courseId) {
      return ctx.badRequest('A valid course ID is required for enrollment.');
    }

    // 2. Enforce Role logic (Only Students enroll themselves in the standard flow)
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser.role.name !== 'Student' && fullUser.role.name !== 'Admin') {
      return ctx.forbidden('Only Students can enroll in courses.');
    }

    // 3. Strict Duplicate Check
    const existingEnrollment = await strapi.db.query('api::enrollment.enrollment').findOne({
      where: {
        student: user.id,
        course: courseId,
      },
    });

    if (existingEnrollment) {
      return ctx.badRequest('You are already enrolled in this course.');
    }

    // 4. Sanitize Payload & Inject Logged-in User ID
    // We override whatever the frontend sent to prevent identity spoofing
    ctx.request.body.data.student = user.id;

    // 5. Execute standard creation
    return await super.create(ctx);
  },

  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    // 6. Data Isolation: Students can only fetch their own enrollments
    if (fullUser.role.name === 'Student') {
      // Ensure ctx.query.filters is an object before merging
      ctx.query.filters = {
        ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
        student: user.id,
      };
    }
    // Admins and Content Managers bypass this filter and can see all enrollments

    return await super.find(ctx);
  }
}));
