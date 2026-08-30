// @ts-nocheck  
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  /**
   * Overrides GET /api/courses/:id
   * Supports both numeric SQLite IDs (e.g. 2) and Strapi v5 DocumentIDs (e.g. tnp72hmb6wqgbi9x3r7cuuzx).
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    let course = null;
    if (/^\d+$/.test(id)) {
      course = await strapi.db.query('api::course.course').findOne({
        where: { id: parseInt(id, 10) },
        populate: {
          instructor: true,
          lessons: true,
          quizzes: true,
        },
      });
    } else {
      course = await strapi.db.query('api::course.course').findOne({
        where: { documentId: id },
        populate: {
          instructor: true,
          lessons: true,
          quizzes: true,
        },
      });
    }

    if (!course) {
      try {
        return await super.findOne(ctx);
      } catch (e) {
        return ctx.notFound('Course not found');
      }
    }

    return { data: course };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const bodyData = ctx.request.body?.data || ctx.request.body || {};
    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: user.id } });
    const instructorIdentifier = fullUser?.documentId || user.id;

    try {
      const newCourse = await strapi.documents('api::course.course').create({
        data: {
          title: bodyData.title,
          description: bodyData.description,
          coverImageUrl: bodyData.coverImageUrl,
          instructor: instructorIdentifier,
        },
        status: bodyData.publishedAt ? 'published' : 'draft'
      });
      return ctx.send({ data: newCourse });
    } catch (err) {
      const newCourse = await strapi.entityService.create('api::course.course', {
        data: {
          title: bodyData.title,
          description: bodyData.description,
          coverImageUrl: bodyData.coverImageUrl,
          instructor: user.id,
          publishedAt: bodyData.publishedAt || new Date(),
        }
      });
      return ctx.send({ data: newCourse });
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id } = ctx.params;

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser?.role?.name === 'Instructor') {
      const course = await strapi.db.query('api::course.course').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
        populate: ['instructor'],
      });
      
      if (!course) return ctx.notFound('Course not found');
      
      if (course.instructor && course.instructor.id !== user.id) {
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

    if (fullUser?.role?.name === 'Instructor') {
      const course = await strapi.db.query('api::course.course').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
        populate: ['instructor'],
      });

      if (!course) return ctx.notFound('Course not found');
      
      if (course.instructor && course.instructor.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete courses you created.');
      }
    }

    return await super.delete(ctx);
  },
}));
