// @ts-nocheck  
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    
    if (fullUser.role.name === 'Instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required');

      const course = await strapi.entityService.findOne('api::course.course', courseId, { populate: ['instructor'] });
      if (!course || course.instructor?.id !== user.id) {
         return ctx.forbidden('Access denied. You can only add quizzes to your own courses.');
      }
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });

    if (fullUser.role.name === 'Instructor') {
      const quiz = await strapi.entityService.findOne('api::quiz.quiz', id, { populate: ['course.instructor'] });
      if (!quiz || quiz.course?.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only update quizzes in your own courses.');
      }
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });

    if (fullUser.role.name === 'Instructor') {
      const quiz = await strapi.entityService.findOne('api::quiz.quiz', id, { populate: ['course.instructor'] });
      if (!quiz || quiz.course?.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete quizzes from your own courses.');
      }
    }

    return await super.delete(ctx);
  }
}));
