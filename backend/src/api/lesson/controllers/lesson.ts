import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  
  // Helper function to verify course ownership for Lessons
  async verifyCourseOwnership(userId, courseId) {
    if (!courseId) return false;
    const course = await strapi.entityService.findOne('api::course.course', courseId, {
      populate: ['instructor']
    });
    return course && course.instructor?.id === userId;
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    
    if (fullUser.role.name === 'Instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required to create a lesson');

      const isOwner = await this.verifyCourseOwnership(user.id, courseId);
      if (!isOwner) return ctx.forbidden('Access denied. You can only add lessons to your own courses.');
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });

    if (fullUser.role.name === 'Instructor') {
      const lesson = await strapi.entityService.findOne('api::lesson.lesson', id, { populate: ['course.instructor'] });
      if (!lesson) return ctx.notFound();
      
      // Access deeply populated course->instructor relationship
      if (lesson.course?.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only update lessons in your own courses.');
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
      const lesson = await strapi.entityService.findOne('api::lesson.lesson', id, { populate: ['course.instructor'] });
      if (!lesson) return ctx.notFound();
      
      if (lesson.course?.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete lessons from your own courses.');
      }
    }

    return await super.delete(ctx);
  }
}));
