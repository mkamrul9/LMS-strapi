fetch('http://127.0.0.1:1337/api/quizzes/inject-dummy', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    console.log(data);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
