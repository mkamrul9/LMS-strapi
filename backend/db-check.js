const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db', { readonly: true });
console.log("Quizzes:", db.prepare("SELECT id, title FROM quizzes").all());
try {
  console.log("Components (1):", db.prepare("SELECT * FROM quizzes_components").all());
} catch (e) {}
try {
  console.log("Components (2):", db.prepare("SELECT * FROM quizzes_cmp_questions_links").all());
} catch (e2) {}
try {
  console.log("Components (3):", db.prepare("SELECT * FROM components_quiz_questions").all());
} catch (e3) {}
db.close();
