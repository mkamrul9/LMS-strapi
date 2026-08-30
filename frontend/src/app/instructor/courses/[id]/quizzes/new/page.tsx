'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions have a correct answer
    for (const q of questions) {
      if (!q.correctAnswer) {
        toast.error('Please select a correct answer for all questions.');
        return;
      }
      if (!q.questionText.trim()) {
        toast.error('Please fill in all question text fields.');
        return;
      }
      if (q.options.some(o => !o.trim())) {
        toast.error('Please fill in all answer options.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/quizzes', {
        data: {
          title,
          course: params.id, // This is the documentId from the URL
          questions: questions,
          publishedAt: new Date().toISOString()
        }
      });
      toast.success('Quiz created successfully!');
      router.push(`/instructor/courses/${params.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create quiz');
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Create Quiz</h1>
          <p className="text-slate-500 mt-1 text-sm">Add multiple-choice questions. Students will be auto-graded when they submit.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quiz Title *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g., Module 1 Assessment"
            />
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Question {qIndex + 1}</h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Question Text *</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your question..."
                    value={q.questionText}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].questionText = e.target.value;
                      setQuestions(updated);
                    }} 
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Option {optIndex + 1} *</label>
                      <input
                        required
                        type="text"
                        placeholder={`Option ${optIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Correct Answer *</label>
                  <select
                    required
                    value={q.correctAnswer}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].correctAnswer = e.target.value;
                      setQuestions(updated);
                    }} 
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="" disabled>Select the correct answer...</option>
                    {q.options.map((opt, optIndex) => (
                      opt.trim() !== '' && <option key={optIndex} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl disabled:opacity-60 transition-colors shadow-sm"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Quiz'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
