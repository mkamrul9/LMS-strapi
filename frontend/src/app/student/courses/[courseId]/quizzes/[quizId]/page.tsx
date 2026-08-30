'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { ChevronLeft, ChevronRight, HelpCircle, AlertCircle, CheckCircle, Award } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Question {
  id: number;
  questionText: string;
  options: string[] | string;
}

interface Quiz {
  id: number;
  documentId?: string;
  title?: string;
  questions?: Question[];
}

interface ScoreResult {
  score: number;
  totalQuestions: number;
  percentage: number;
}

export default function QuizTakerPage() {
  const params = useParams();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await apiClient.get(`/quizzes/${params.quizId}?populate[questions]=*`);
        const data = response.data.data;
        console.log('Quiz fetch result:', data);
        
        // Normalize: handle both Strapi V4 and V5 formats
        const normalized: Quiz = {
          id: data.id,
          documentId: data.documentId,
          title: data.title || data.attributes?.title,
          questions: data.questions || data.attributes?.questions || [],
        };

        setQuiz(normalized);
      } catch (error: any) {
        console.error('Failed to fetch quiz:', error);
        toast.error(error.response?.data?.error?.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.quizId) fetchQuiz();
  }, [params.quizId]);

  const handleOptionSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (quiz?.questions && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      answer: ans
    }));

    try {
      const response = await apiClient.post(`/quizzes/${params.quizId}/submit`, {
        data: { answers: formattedAnswers }
      });
      
      setScoreResult(response.data.data);
      toast.success('Quiz submitted! See your results below.');
    } catch (error: any) {
      console.error('Failed to submit quiz:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedLayout>
    );
  }

  const questions = quiz?.questions || [];
  const quizTitle = quiz?.title;

  if (!quiz || questions.length === 0) {
    return (
      <ProtectedLayout>
        <div className="bg-white border rounded-2xl p-12 text-center max-w-2xl mx-auto mt-10 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Unavailable</h2>
          <p className="text-slate-500 mb-6">This quiz has no questions or could not be loaded.</p>
          <Link
            href={`/student/courses/${params.courseId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Return to Course
          </Link>
        </div>
      </ProtectedLayout>
    );
  }

  // Scorecard UI
  if (scoreResult) {
    const isPassing = scoreResult.percentage >= 70;
    return (
      <ProtectedLayout>
        <div className="max-w-2xl mx-auto mt-10">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
              isPassing ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              {isPassing ? (
                <Award className="w-12 h-12 text-emerald-600" />
              ) : (
                <AlertCircle className="w-12 h-12 text-amber-600" />
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              {isPassing ? 'Excellent Work! 🎉' : 'Quiz Completed'}
            </h1>
            <p className="text-slate-500 mb-8">{quizTitle}</p>
            
            <div className="flex justify-center gap-8 mb-10 border-y py-8 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Score</p>
                <p className={`text-4xl font-bold ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {scoreResult.score} / {scoreResult.totalQuestions}
                </p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Percentage</p>
                <p className={`text-4xl font-bold ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {scoreResult.percentage}%
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href={`/student/courses/${params.courseId}`}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Return to Course
              </Link>
              {!isPassing && (
                <button
                  onClick={() => {
                    setScoreResult(null);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  let parsedOptions: string[] = [];
  try {
    parsedOptions = typeof currentQuestion.options === 'string' 
      ? JSON.parse(currentQuestion.options) 
      : (currentQuestion.options as string[]);
  } catch (e) {
    console.error("Failed to parse options", e);
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isFullyAnswered = answeredCount === totalQuestions;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/student/courses/${params.courseId}`} className="text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">{quizTitle}</h1>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            </div>
            <div className="text-sm font-semibold text-slate-500">
              {answeredCount} / {totalQuestions} Answered
            </div>
          </div>
          
          <div className="w-full bg-slate-200 h-1.5 mt-4 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 mb-6 min-h-[300px]">
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
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    </div>
                    {option}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1 px-5 py-2.5 font-semibold text-slate-700 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!isFullyAnswered || isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
            >
              {isSubmitting ? 'Grading...' : `Submit Quiz (${answeredCount}/${totalQuestions})`}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 font-semibold text-slate-900 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
