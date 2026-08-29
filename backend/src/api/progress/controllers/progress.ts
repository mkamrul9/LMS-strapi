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

    // Resolve numeric Course ID if string was passed
    let numericCourseId = courseId;
    if (typeof courseId === 'string' && !/^\d+$/.test(courseId)) {
      const courseObj = await strapi.db.query('api::course.course').findOne({
        where: { documentId: courseId },
      });
      if (courseObj) numericCourseId = courseObj.id;
    } else {
      numericCourseId = parseInt(courseId, 10);
    }

    // 1. Calculate denominator (Total Lessons active in the course)
    const totalLessons = await strapi.db.query('api::lesson.lesson').count({
      where: { course: numericCourseId },
    });

    if (totalLessons === 0) {
      return ctx.send({
        data: { percentage: 0, completed: 0, total: 0 }
      });
    }

    // 2. Calculate numerator (Lessons marked complete by this student)
    const completedLessons = await strapi.db.query('api::progress.progress').count({
      where: {
        student: user.id,
        course: numericCourseId,
        isCompleted: true,
      },
    });

    // 3. Compute final rounded percentage
    const percentage = Math.round((completedLessons / totalLessons) * 100);

    return ctx.send({
      data: {
        percentage,
        completed: completedLessons,
        total: totalLessons,
      }
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

    const bodyData = ctx.request.body?.data || ctx.request.body || {};
    const { lesson: lessonId, course: courseId, isCompleted } = bodyData;

    if (!lessonId || !courseId) {
      return ctx.badRequest('Lesson ID and Course ID are required.');
    }

    // Resolve numeric Course & Lesson IDs if documentId passed
    let numCourseId = courseId;
    if (typeof courseId === 'string' && !/^\d+$/.test(courseId)) {
      const c = await strapi.db.query('api::course.course').findOne({ where: { documentId: courseId } });
      if (c) numCourseId = c.id;
    } else {
      numCourseId = parseInt(courseId, 10);
    }

    let numLessonId = lessonId;
    if (typeof lessonId === 'string' && !/^\d+$/.test(lessonId)) {
      const l = await strapi.db.query('api::lesson.lesson').findOne({ where: { documentId: lessonId } });
      if (l) numLessonId = l.id;
    } else {
      numLessonId = parseInt(lessonId, 10);
    }

    // 1. Check for existing footprint
    const existingProgress = await strapi.db.query('api::progress.progress').findOne({
      where: {
        student: user.id,
        lesson: numLessonId,
        course: numCourseId,
      },
    });

    if (existingProgress) {
      // 2a. UPDATE (Toggle State)
      const updated = await strapi.entityService.update('api::progress.progress', existingProgress.id, {
        data: { isCompleted: isCompleted !== undefined ? isCompleted : true },
      });
      return { data: updated };
    } else {
      // 2b. INSERT (Fresh Record)
      const newProgress = await strapi.entityService.create('api::progress.progress', {
        data: {
          student: user.id,
          lesson: numLessonId,
          course: numCourseId,
          isCompleted: isCompleted !== undefined ? isCompleted : true,
          publishedAt: new Date(),
        },
      });
      return { data: newProgress };
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

    const isStudent = fullUser?.role?.name === 'Student';
    const studentFilter = isStudent ? { student: user.id } : {};

    const progresses = await strapi.db.query('api::progress.progress').findMany({
      where: studentFilter,
      populate: {
        lesson: true,
        course: true,
      },
    });

    return { data: progresses };
  }
}));
