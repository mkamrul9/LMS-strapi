export default {
  routes: [
    {
      method: 'POST',
      path: '/quizzes/inject-dummy',
      handler: 'quiz.injectDummy',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/quizzes/:id/submit',
      handler: 'quiz.submit',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
