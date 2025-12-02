import React, { useState } from 'react';
import { Plus, Loader2, Wand2 } from 'lucide-react';
import { Category } from '../types';
import { categorizeTask } from '../services/geminiService';

interface AddTodoProps {
  onAdd: (text: string, category: Category) => void;
}

export const AddTodo: React.FC<AddTodoProps> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>(Category.PERSONAL);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text, category);
      setText('');
      setCategory(Category.PERSONAL); // Reset to default
    }
  };

  const handleMagicCategorize = async () => {
      if (!text.trim()) return;
      setIsCategorizing(true);
      const suggested = await categorizeTask(text);
      setCategory(suggested);
      setIsCategorizing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Plus className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
        />
        
        <div className="flex gap-2">
            <div className="relative">
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="block w-full pl-3 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-white shadow-sm appearance-none cursor-pointer"
                >
                {Object.values(Category).map((cat) => (
                    <option key={cat} value={cat}>
                    {cat}
                    </option>
                ))}
                </select>
                {/* Custom arrow for select if needed, or rely on browser default */}
            </div>

            <button
                type="button"
                onClick={handleMagicCategorize}
                disabled={isCategorizing || !text}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                title="Auto-categorize with AI"
            >
                {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Wand2 className="w-5 h-5" />}
            </button>

            <button
            type="submit"
            disabled={!text.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
            Add
            </button>
        </div>
      </div>
    </form>
  );
};