// @ts-nocheck
import { factories } from '@strapi/strapi';

/**
 * Custom Progress Controller
 * 
 * Manages the atomic tracking of a student's progress through a course's curriculum.
 * Replaces default Strapi CRUD with idempotent upserts and dynamic progress calculation algorithms.
 */
export default factories.createCoreController('api::progress.progress', ({ strapi }) => ({
  
  /**
   * Custom Endpoint: GET /api/progresses/percentage/:courseId
   * 
   * Dynamic Percentage Calculation Engine.
   * Calculates the exact completion percentage of a student for a specific course by 
   * cross-referencing the total number of lessons with their individually marked completions.
   * 
   * @param {object} ctx - Koa context containing courseId params and auth state.
   */
  async getCoursePercentage(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { courseId } = ctx.params;

    // 1. Calculate the denominator (Total Lessons currently active in the course)
    const totalLessons = await strapi.db.query('api::lesson.lesson').count({
      where: { course: courseId },
    });

    if (totalLessons === 0) {
      return ctx.send({ percentage: 0, completed: 0, total: 0 });
    }

    // 2. Calculate the numerator (Lessons marked complete by this exact student)
    const completedLessons = await strapi.db.query('api::progress.progress').count({
      where: {
        student: user.id,
        course: courseId,
        isCompleted: true,
      },
    });

    // 3. Compute final rounded percentage
    const percentage = Math.round((completedLessons / totalLessons) * 100);

    return ctx.send({
      percentage,
      completed: completedLessons,
      total: totalLessons,
    });
  },

  /**
   * Overrides POST /api/progresses
   * 
   * Atomic Upsert Engine for Toggling Progress.
   * Prevents duplicate rows by checking if a record already exists for the (Student + Lesson) compound key.
   * If it exists, it mutates the boolean toggle. If it doesn't, it creates a fresh record.
   */
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { lesson: lessonId, course: courseId, isCompleted } = ctx.request.body.data || {};

    if (!lessonId || !courseId) {
      return ctx.badRequest('Lesson ID and Course ID are required.');
    }

    // 1. Check for existing footprint
    const existingProgress = await strapi.db.query('api::progress.progress').findOne({
      where: {
        student: user.id,
        lesson: lessonId,
        course: courseId,
      },
    });

    if (existingProgress) {
      // 2a. UPDATE (Toggle State)
      const updated = await strapi.entityService.update('api::progress.progress', existingProgress.id, {
        data: { isCompleted: isCompleted !== undefined ? isCompleted : true },
      });
      // Return wrapped in { data: {...} } to match Strapi's standard response schema
      return { data: updated };
    } else {
      // 2b. INSERT (Fresh Record)
      // Strictly enforce the student ID to prevent spoofing
      ctx.request.body.data.student = user.id;
      if (ctx.request.body.data.isCompleted === undefined) {
        ctx.request.body.data.isCompleted = true; // Default to true if omitted
      }
      return await super.create(ctx);
    }
  },

  /**
   * Overrides GET /api/progresses
   * 
   * Data Isolation Guard.
   * Ensures that students querying the progress endpoint only receive their own rows, preventing 
   * horizontal privilege escalation (e.g., viewing another student's progress).
   */
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });

    if (fullUser.role.name === 'Student') {
      // Force injection of the user.id into the filter tree
      ctx.query.filters = {
        ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
        student: user.id,
      };
    }

    return await super.find(ctx);
  }
}));
