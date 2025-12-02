import React, { useState } from 'react';
import { Check, Trash2, Sparkles, ChevronDown, ChevronUp, GripVertical, AlertCircle } from 'lucide-react';
import { Todo, SubTask } from '../types';
import { suggestSubtasks } from '../services/geminiService';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtasks: (id: string, subtasks: SubTask[]) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onAddSubtasks,
  onToggleSubtask
}) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAISubtasks = async () => {
    if (todo.subtasks && todo.subtasks.length > 0) {
      setIsExpanding(!isExpanding);
      return;
    }

    setLoadingAI(true);
    setError(null);
    try {
      const suggestions = await suggestSubtasks(todo.text);
      if (suggestions.length === 0) {
          setError("Could not generate subtasks.");
      } else {
        const newSubtasks: SubTask[] = suggestions.map(text => ({
            id: crypto.randomUUID(),
            text,
            completed: false
        }));
        onAddSubtasks(todo.id, newSubtasks);
        setIsExpanding(true);
      }
    } catch (e) {
      setError("AI service unavailable.");
    } finally {
      setLoadingAI(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Work': return 'bg-blue-100 text-blue-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'Personal': return 'bg-green-100 text-green-800';
      case 'Learning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 mb-3 ${todo.completed ? 'opacity-75 bg-gray-50' : ''}`}>
      <div className="p-4 flex items-center gap-3">
        {/* Toggle Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completed 
              ? 'bg-indigo-500 border-indigo-500 text-white' 
              : 'border-gray-300 hover:border-indigo-500 text-transparent'
          }`}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </button>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium truncate ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {todo.text}
          </p>
          <div className="flex items-center gap-2 mt-1">
             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(todo.category)}`}>
               {todo.category}
             </span>
             {todo.subtasks && todo.subtasks.length > 0 && (
                 <span className="text-xs text-gray-400">
                     {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length} subtasks
                 </span>
             )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {error && <span className="text-xs text-red-500 mr-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{error}</span>}
            
            <button 
                onClick={handleAISubtasks}
                disabled={loadingAI || todo.completed}
                className={`p-2 rounded-lg transition-colors ${loadingAI ? 'bg-indigo-50' : 'hover:bg-indigo-50 text-indigo-600'}`}
                title="Breakdown with AI"
            >
                {loadingAI ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>

            <button 
                onClick={() => onDelete(todo.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Subtasks Section */}
      {(isExpanding || (todo.subtasks && todo.subtasks.length > 0 && isExpanding)) && (
        <div className="bg-gray-50 border-t border-gray-100 rounded-b-xl px-4 py-3 pl-12 space-y-2 animate-in slide-in-from-top-2">
            {todo.subtasks?.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-3 text-sm">
                    <button
                        onClick={() => onToggleSubtask(todo.id, subtask.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            subtask.completed ? 'bg-indigo-400 border-indigo-400 text-white' : 'border-gray-300 bg-white'
                        }`}
                    >
                        {subtask.completed && <Check className="w-3 h-3" />}
                    </button>
                    <span className={subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                        {subtask.text}
                    </span>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};