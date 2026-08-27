'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { ChevronLeft, ChevronRight, HelpCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: number;
  questionText: string;
  options: string[] | string; // Strapi JSON fields can sometimes come as stringified arrays
}

interface Quiz {
  id: number;
  attributes: {
    title: string;
    questions: Question[];
  };
}

export default function QuizTakerPage() {
  const params = useParams();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await apiClient.get(`/quizzes/${params.quizId}?populate=questions`);
        setQuiz(response.data.data);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
        router.push(`/student/courses/${params.courseId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.quizId) fetchQuiz();
  }, [params.quizId, params.courseId, router]);

  const handleOptionSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.attributes.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // We will fully implement this connection in Phase 22.
    // For now, we simulate the structure we will send to the backend.
    setIsSubmitting(true);
    
    const payload = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      answer: ans
    }));

    console.log("Submitting Payload to Evaluation Engine:", payload);
    alert("Quiz state captured! Backend integration coming in Phase 22.");
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-20 text-slate-500">Loading quiz environment...</div>
      </ProtectedLayout>
    );
  }

  if (!quiz || !quiz.attributes.questions || quiz.attributes.questions.length === 0) {
    return (
      <ProtectedLayout>
        <div className="bg-white border rounded-lg p-12 text-center max-w-2xl mx-auto mt-10">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Unavailable</h2>
          <p className="text-slate-500 mb-6">This quiz contains no questions or is misconfigured.</p>
          <Link 
            href={`/student/courses/${params.courseId}`}
            className="text-blue-600 hover:underline font-medium"
          >
            Return to Course
          </Link>
        </div>
      </ProtectedLayout>
    );
  }

  const questions = quiz.attributes.questions;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Safely parse JSON options
  let parsedOptions: string[] = [];
  try {
    parsedOptions = typeof currentQuestion.options === 'string' 
      ? JSON.parse(currentQuestion.options) 
      : currentQuestion.options;
  } catch (e) {
    console.error("Failed to parse options", e);
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isFullyAnswered = answeredCount === totalQuestions;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        
        {/* Header & Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href={`/student/courses/${params.courseId}`}
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">{quiz.attributes.title}</h1>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            </div>
            <div className="text-sm font-medium text-slate-500">
              {answeredCount} / {totalQuestions} Answered
            </div>
          </div>
          
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 mt-4 rounded-full overflow-hidden">
             <div 
                className="bg-blue-600 h-1.5 transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
             ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border rounded-xl shadow-sm p-8 mb-6 min-h-[300px]">
          <h2 className="text-xl font-semibold text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {parsedOptions.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(currentQuestion.id, option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    </div>
                    {option}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1 px-5 py-2.5 font-medium text-slate-700 bg-white border shadow-sm rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!isFullyAnswered || isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
            >
              {isSubmitting ? 'Evaluating...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 font-medium text-slate-900 bg-white border shadow-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </ProtectedLayout>
  );
}
