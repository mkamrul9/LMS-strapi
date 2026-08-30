fetch('http://127.0.0.1:1337/api/quizzes')
  .then(res => res.json())
  .then(data => {
    if (data.data && data.data.length > 0) {
      const firstQuiz = data.data[0];
      const docId = firstQuiz.documentId || firstQuiz.id;
      return fetch(`http://127.0.0.1:1337/api/quizzes/${docId}?populate[questions]=*`);
    }
    throw new Error('No quizzes found');
  })
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
