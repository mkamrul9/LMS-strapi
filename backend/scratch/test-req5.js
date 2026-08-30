fetch('http://127.0.0.1:1337/api/quizzes?populate=questions,course')
  .then(res => res.json())
  .then(data => {
    console.log("Keys of first quiz:", Object.keys(data.data[0]));
    console.log("Course:", data.data[0].course);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
