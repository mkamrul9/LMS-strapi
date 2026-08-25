import type { Schema, Struct } from '@strapi/strapi';

export interface QuizQuestion extends Struct.ComponentSchema {
  collectionName: 'components_quiz_questions';
  info: {
    description: '';
    displayName: 'Question';
    icon: 'question-circle';
  };
  attributes: {
    correctAnswer: Schema.Attribute.String & Schema.Attribute.Required;
    options: Schema.Attribute.JSON & Schema.Attribute.Required;
    questionText: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'quiz.question': QuizQuestion;
    }
  }
}
