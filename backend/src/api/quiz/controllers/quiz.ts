// @ts-nocheck
import { factories } from '@strapi/strapi';

/**
 * Custom Quiz Controller
 * 
 * Extends standard CRUD with a complex, server-side auto-grading engine (`submit`),
 * and enforces strict ownership rules ensuring Instructors can only modify quizzes belonging to their courses.
 */
export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  
  async injectDummy(ctx) {
    const quizzes = await strapi.db.query('api::quiz.quiz').findMany({
      populate: ['questions', 'course']
    });

    let fixedCount = 0;

    for (const quiz of quizzes) {
      if (!quiz.questions || quiz.questions.length === 0) {
        await strapi.entityService.update('api::quiz.quiz', quiz.id, {
          data: {
            questions: [
              {
                __component: 'quiz.question',
                questionText: 'What is 2 + 2?',
                options: ['2', '3', '4', '5'],
                correctAnswer: '4'
              },
              {
                __component: 'quiz.question',
                questionText: 'Which planet is known as the Red Planet?',
                options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
                correctAnswer: 'Mars'
              },
              {
                __component: 'quiz.question',
                questionText: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correctAnswer: 'Paris'
              }
            ]
          }
        });
        fixedCount++;
      }
    }
    
    return ctx.send({ message: `Fixed dummy quizzes for ${fixedCount} courses.` });
  },
  /**
   * Custom Endpoint: POST /api/quizzes/:id/submit
   * 
   * Server-Side Auto-Grading Engine.
   * This is critical to prevent students from cheating by inspecting network payloads. The client
   * only sends their answers; the server fetches the answer key securely, calculates the score,
   * and commits an immutable receipt.
   * 
   * @param {object} ctx - Expected payload: { data: { answers: [{ questionId: 1, answer: "A" }] } } or { answers: [...] }
   */
  async submit(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id: quizId } = ctx.params;
    const bodyData = ctx.request.body?.data || ctx.request.body || {};
    const answers = bodyData.answers;

    // Basic payload validation
    if (!answers || !Array.isArray(answers)) {
      return ctx.badRequest('Answers must be provided as an array.');
    }

    // 1. Secure Data Retrieval
    // Fetch the quiz and its questions strictly from the server DB to get the true `correctAnswer` values.
    const quiz = await strapi.db.query('api::quiz.quiz').findOne({
      where: /^\d+$/.test(quizId) ? { id: parseInt(quizId, 10) } : { documentId: quizId },
      populate: {
        questions: true,
      },
    });

    if (!quiz) return ctx.notFound('Quiz not found');

    let score = 0;
    const totalQuestions = quiz.questions?.length || 0;

    if (totalQuestions === 0) {
      return ctx.badRequest('This quiz has no questions.');
    }

    // 2. Blind Evaluation Engine
    // Iterate over the source of truth (DB questions) and cross-reference with the student payload.
    quiz.questions.forEach((dbQuestion) => {
      const studentAnswer = answers.find(
        (a) => a.questionId === dbQuestion.id || a.id === dbQuestion.id
      );
      const studentChosen = studentAnswer?.answer || studentAnswer?.selectedOption || studentAnswer?.choice;
      if (studentChosen && studentChosen === dbQuestion.correctAnswer) {
        score++;
      }
    });

    // 3. Immutable Record Creation
    // Store the graded result as a definitive receipt.
    const submission = await strapi.entityService.create('api::quiz-submission.quiz-submission', {
      data: {
        student: user.id,
        quiz: quiz.id,
        score,
        totalQuestions,
        publishedAt: new Date(),
      },
    });

    // 4. Client Response
    // Return the calculated grade immediately to the frontend.
    return ctx.send({
      data: {
        id: submission.id,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
      }
    });
  },

  /**
   * Overrides POST /api/quizzes
   * Enforces that Instructors can only attach quizzes to Courses they explicitly own.
   */
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    
    if (fullUser?.role?.name === 'Instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required');

      // Hydrate the target course to verify its instructor relation
      const course = await strapi.db.query('api::course.course').findOne({
        where: /^\d+$/.test(courseId) ? { id: parseInt(courseId, 10) } : { documentId: courseId },
        populate: ['instructor'],
      });
      
      if (!course || course.instructor?.id !== user.id) {
         return ctx.forbidden('Access denied. You can only add quizzes to your own courses.');
      }
    }

    return await super.create(ctx);
  },

  /**
   * Overrides PUT /api/quizzes/:id
   * Validates instructor ownership before allowing mutations.
   */
  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });

    if (fullUser?.role?.name === 'Instructor') {
      const quiz = await strapi.db.query('api::quiz.quiz').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
        populate: { course: { populate: ['instructor'] } },
      });
      if (!quiz || quiz.course?.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only update quizzes in your own courses.');
      }
    }

    return await super.update(ctx);
  },

  /**
   * Overrides DELETE /api/quizzes/:id
   * Validates instructor ownership before allowing deletions.
   */
  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const fullUser = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });

    if (fullUser?.role?.name === 'Instructor') {
      const quiz = await strapi.db.query('api::quiz.quiz').findOne({
        where: /^\d+$/.test(id) ? { id: parseInt(id, 10) } : { documentId: id },
        populate: { course: { populate: ['instructor'] } },
      });
      if (!quiz || quiz.course?.instructor?.id !== user.id) {
        return ctx.forbidden('Access denied. You can only delete quizzes from your own courses.');
      }
    }

    return await super.delete(ctx);
  }
}));
