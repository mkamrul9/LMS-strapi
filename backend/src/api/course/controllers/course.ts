import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    // 1. Force the logged-in user as the instructor
    if (ctx.request.body.data) {
      ctx.request.body.data.instructor = user.id;
    }

    // 2. Proceed with standard creation
    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;

    // Fetch user role safely
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    // 3. Ownership check for Instructors
    if (fullUser.role.name === 'Instructor') {
      const course = await strapi.entityService.findOne('api::course.course', id, {
        populate: ['instructor'],
      });
      
      if (!course) return ctx.notFound('Course not found');
      
      if (course.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only update courses you created.');
      }
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser.role.name === 'Instructor') {
      const course = await strapi.entityService.findOne('api::course.course', id, {
        populate: ['instructor'],
      });

      if (!course) return ctx.notFound('Course not found');
      
      if (course.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete courses you created.');
      }
    }

    return await super.delete(ctx);
  },
}));
