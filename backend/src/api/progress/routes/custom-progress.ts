export default {
  routes: [
    {
      method: 'GET',
      path: '/progresses/percentage/:courseId',
      handler: 'progress.getCoursePercentage',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
