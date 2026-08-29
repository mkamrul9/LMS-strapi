const { createStrapi } = require('@strapi/strapi');

async function addDummyQuestions() {
  console.log('Bootstrapping Strapi...');
  const app = createStrapi();
  await app.load();
  
  const quizzes = await app.db.query('api::quiz.quiz').findMany();
  console.log(`Found ${quizzes.length} quizzes in the database.`);

  if (quizzes.length === 0) {
    console.log('No quizzes found. Please create a quiz in the UI first.');
    process.exit(0);
  }

  for (const quiz of quizzes) {
    await app.db.query('api::quiz.quiz').update({
      where: { id: quiz.id },
      data: {
        questions: [
          {
            __component: 'quiz.question',
            questionText: 'What is 2 + 2?',
            options: JSON.stringify(['2', '3', '4', '5']),
            correctAnswer: '4'
          },
          {
            __component: 'quiz.question',
            questionText: 'Which planet is known as the Red Planet?',
            options: JSON.stringify(['Earth', 'Mars', 'Jupiter', 'Saturn']),
            correctAnswer: 'Mars'
          },
          {
            __component: 'quiz.question',
            questionText: 'What is the capital of France?',
            options: JSON.stringify(['London', 'Berlin', 'Paris', 'Madrid']),
            correctAnswer: 'Paris'
          }
        ]
      }
    });
    console.log(`Successfully added 3 dummy questions to Quiz ID: ${quiz.id}`);
  }
  
  console.log('Finished updating quizzes.');
  process.exit(0);
}

addDummyQuestions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
