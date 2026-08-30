'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import apiClient from '@/lib/axios';
import { Plus, Trash2 } from 'lucide-react';
import AlertModal from '@/components/ui/AlertModal';

export default function QuizBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string, title?: string}>({ isOpen: false, message: '' });
  const showAlert = (message: string, title = 'Notification') => setAlertConfig({ isOpen: true, message, title });
  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    // Auto-sync correct answer if they edit the exact text of the option they selected
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate
    for (const q of questions) {
      if (!q.correctAnswer) {
        showAlert('Please select a correct answer for all questions.', 'Validation Error');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await apiClient.post('/quizzes', {
        data: {
          title,
          course: params.id,
          questions: questions,
          publishedAt: new Date().toISOString()
        }
      });
      router.push(`/instructor/courses/${params.id}`);
    } catch (error: any) {
      showAlert(error.response?.data?.error?.message || 'Failed to create quiz', 'Error');
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <AlertModal isOpen={alertConfig.isOpen} onClose={closeAlert} message={alertConfig.message} title={alertConfig.title} />
      <div className="max-w-3xl mx-auto pb-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Create Quiz</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title *</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2.5 rounded focus:ring-slate-900" placeholder="e.g., Midterm Assessment" />
          </div>

          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white border rounded-xl shadow-sm p-6 relative">
                {questions.length > 1 && (
                  <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                
                <h3 className="font-bold text-slate-900 mb-4">Question {qIndex + 1}</h3>
                
                <div className="mb-4">
                  <input required type="text" placeholder="Enter question..." value={q.questionText} onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].questionText = e.target.value;
                      setQuestions(updated);
                    }} 
                    className="w-full border p-2.5 rounded focus:ring-slate-900 font-medium" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {q.options.map((opt, optIndex) => (
                    <input key={optIndex} required type="text" placeholder={`Option ${optIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="w-full border p-2 rounded text-sm" />
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer *</label>
                  <select required value={q.correctAnswer} onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].correctAnswer = e.target.value;
                      setQuestions(updated);
                    }} 
                    className="w-full border p-2.5 rounded bg-slate-50 focus:ring-slate-900"
                  >
                    <option value="" disabled>Select the correct option...</option>
                    {q.options.map((opt, optIndex) => (
                      opt.trim() !== '' && <option key={optIndex} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button type="button" onClick={handleAddQuestion} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-md font-medium hover:bg-slate-200">
              <Plus className="w-4 h-4" /> Add Question
            </button>
            <div className="space-x-3">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md font-medium">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Publish Quiz'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
