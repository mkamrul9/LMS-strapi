fetch('http://127.0.0.1:1337/api/quizzes?populate=*')
  .then(res => res.json())
  .then(data => {
    console.log("Keys of first quiz:", Object.keys(data.data[0]));
    console.log("Course:", data.data[0].course);
    console.log("Questions:", data.data[0].questions);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
