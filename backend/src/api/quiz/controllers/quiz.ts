// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  
  // Custom Endpoint: Server-side Auto-Grading
  async submit(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { id: quizId } = ctx.params;
    // Expected payload: { data: { answers: [{ questionId: 1, answer: "A" }] } }
    const { answers } = ctx.request.body.data || {};

    if (!answers || !Array.isArray(answers)) {
      return ctx.badRequest('Answers must be provided as an array.');
    }

    // 1. Fetch the quiz and its questions securely from the DB
    const quiz = await strapi.entityService.findOne('api::quiz.quiz', quizId, {
      populate: ['questions'],
    });

    if (!quiz) return ctx.notFound('Quiz not found');

    let score = 0;
    const totalQuestions = quiz.questions?.length || 0;

    if (totalQuestions === 0) {
      return ctx.badRequest('This quiz has no questions.');
    }

    // 2. Blind Evaluation Engine
    quiz.questions.forEach((dbQuestion) => {
      const studentAnswer = answers.find(a => a.questionId === dbQuestion.id);
      if (studentAnswer && studentAnswer.answer === dbQuestion.correctAnswer) {
        score++;
      }
    });

    // 3. Create the immutable Quiz Submission record
    const submission = await strapi.entityService.create('api::quiz-submission.quiz-submission', {
      data: {
        student: user.id,
        quiz: quizId,
        score,
        totalQuestions,
      },
    });

    // 4. Return the calculated grade immediately
    return ctx.send({
      data: {
        id: submission.id,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
      }
    });
  },

  // --- Phase 06: Ownership Overrides Below ---
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
