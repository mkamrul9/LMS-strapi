// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-submission.quiz-submission', ({ strapi }) => ({
  
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser.role.name === 'Student') {
      ctx.query.filters = {
        ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
        student: user.id,
      };
    }

    return await super.find(ctx);
  }
  
}));
