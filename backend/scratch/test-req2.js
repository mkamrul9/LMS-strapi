fetch('http://127.0.0.1:1337/api/quizzes?populate[questions]=*&populate[course]=*')
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
