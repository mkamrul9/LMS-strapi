const strapi = require('@strapi/strapi');

async function check() {
  const app = await strapi().load();
  
  const quizzes = await app.db.query('api::quiz.quiz').findMany({
    populate: ['questions']
  });

  console.log('Quizzes in DB:', JSON.stringify(quizzes, null, 2));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
