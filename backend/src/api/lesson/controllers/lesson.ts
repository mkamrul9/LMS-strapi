// @ts-nocheck  
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  
  // Helper function to verify course ownership for Lessons (supports both numeric ID and documentId)
  async verifyCourseOwnership(userId, courseId) {
    if (!courseId) return false;
    const course = await strapi.db.query('api::course.course').findOne({
      where: /^\d+$/.test(courseId) ? { id: parseInt(courseId, 10) } : { documentId: courseId },
      populate: ['instructor']
    });
    return course && (course.instructor?.id === userId || course.instructor?.documentId === userId);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    const bodyData = ctx.request.body?.data || ctx.request.body || {};
    const courseId = bodyData.course;

    if (fullUser?.role?.name === 'Instructor') {
      if (!courseId) return ctx.badRequest('Course ID is required to create a lesson');

      const isOwner = await this.verifyCourseOwnership(user.id, courseId);
      if (!isOwner) return ctx.forbidden('Access denied. You can only add lessons to your own courses.');
    }

    // Resolve target course documentId & numeric ID
    let targetCourseDocId = courseId;
    let targetCourseNumId = courseId;
    if (/^\d+$/.test(courseId)) {
      const found = await strapi.db.query('api::course.course').findOne({ where: { id: parseInt(courseId, 10) } });
      if (found?.documentId) targetCourseDocId = found.documentId;
      targetCourseNumId = parseInt(courseId, 10);
    } else if (courseId) {
      const found = await strapi.db.query('api::course.course').findOne({ where: { documentId: courseId } });
      if (found?.id) targetCourseNumId = found.id;
    }

    try {
      const newLesson = await strapi.documents('api::lesson.lesson').create({
        data: {
          title: bodyData.title,
          content: bodyData.content,
          videoUrl: bodyData.videoUrl,
          order: bodyData.order || 1,
          course: targetCourseDocId,
        },
        status: bodyData.publishedAt ? 'published' : 'draft'
      });
      return ctx.send({ data: newLesson });
    } catch (err) {
      const newLesson = await strapi.entityService.create('api::lesson.lesson', {
        data: {
          title: bodyData.title,
          content: bodyData.content,
          videoUrl: bodyData.videoUrl,
          order: bodyData.order || 1,
          course: targetCourseNumId,
          publishedAt: bodyData.publishedAt || new Date(),
        }
      });
      return ctx.send({ data: newLesson });
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });

    if (fullUser?.role?.name === 'Instructor') {
      const lesson = await strapi.db.query('api::lesson.lesson').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
        populate: { course: { populate: ['instructor'] } },
      });
      if (!lesson) return ctx.notFound('Lesson not found');
      
      if (lesson.course?.instructor && lesson.course.instructor.id !== user.id) {
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

    if (fullUser?.role?.name === 'Instructor') {
      const lesson = await strapi.db.query('api::lesson.lesson').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
        populate: { course: { populate: ['instructor'] } },
      });
      if (!lesson) return ctx.notFound('Lesson not found');
      
      if (lesson.course?.instructor && lesson.course.instructor.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete lessons from your own courses.');
      }
    }

    return await super.delete(ctx);
  }
}));
