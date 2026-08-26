// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::progress.progress', ({ strapi }) => ({
  
  // 1. Custom Endpoint: Dynamic Percentage Math
  async getCoursePercentage(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { courseId } = ctx.params;

    // Count total lessons currently in the course
    const totalLessons = await strapi.db.query('api::lesson.lesson').count({
      where: { course: courseId },
    });

    if (totalLessons === 0) {
      return ctx.send({ percentage: 0, completed: 0, total: 0 });
    }

    // Count how many lessons this specific student marked as complete
    const completedLessons = await strapi.db.query('api::progress.progress').count({
      where: {
        student: user.id,
        course: courseId,
        isCompleted: true,
      },
    });

    const percentage = Math.round((completedLessons / totalLessons) * 100);

    return ctx.send({
      percentage,
      completed: completedLessons,
      total: totalLessons,
    });
  },

  // 2. Atomic Upsert for Toggling Progress
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { lesson: lessonId, course: courseId, isCompleted } = ctx.request.body.data || {};

    if (!lessonId || !courseId) {
      return ctx.badRequest('Lesson ID and Course ID are required.');
    }

    // Check if this student already has a progress record for this lesson
    const existingProgress = await strapi.db.query('api::progress.progress').findOne({
      where: {
        student: user.id,
        lesson: lessonId,
        course: courseId,
      },
    });

    if (existingProgress) {
      // If it exists, just update the isCompleted boolean (toggle on/off)
      const updated = await strapi.entityService.update('api::progress.progress', existingProgress.id, {
        data: { isCompleted: isCompleted !== undefined ? isCompleted : true },
      });
      // Return wrapped in { data: {...} } to match Strapi's standard response format
      return { data: updated };
    } else {
      // If it doesn't exist, strictly enforce the student ID and create it
      ctx.request.body.data.student = user.id;
      if (ctx.request.body.data.isCompleted === undefined) {
        ctx.request.body.data.isCompleted = true; // Default to true if missing
      }
      return await super.create(ctx);
    }
  },

  // 3. Data Isolation: Students only see their own progress records
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
