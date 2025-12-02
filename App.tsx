import React, { useState, useEffect, useCallback } from 'react';
import { ListTodo, CheckCircle2, Zap, Layers } from 'lucide-react';
import { Todo, Category, FilterType, SubTask } from './types';
import { prioritizeTasks } from './services/geminiService';
import { AddTodo } from './components/AddTodo';
import { TodoItem } from './components/TodoItem';
import { Stats } from './components/Stats';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('zen_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('zen_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string, category: Category) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      category,
      createdAt: Date.now()
    };
    setTodos([newTodo, ...todos]);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const addSubtasks = (id: string, subtasks: SubTask[]) => {
      setTodos(todos.map(t => 
        t.id === id ? { ...t, subtasks } : t
      ));
  };

  const toggleSubtask = (todoId: string, subtaskId: string) => {
      setTodos(todos.map(t => {
          if (t.id !== todoId) return t;
          const updatedSubtasks = t.subtasks?.map(s => 
              s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          return { ...t, subtasks: updatedSubtasks };
      }));
  }

  const handleSmartPrioritize = async () => {
    if (todos.length < 2) return;
    setIsPrioritizing(true);
    
    // Only prioritize active tasks
    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    const prioritizedIds = await prioritizeTasks(activeTodos);
    
    // Reconstruct the array based on returned IDs
    const reorderedActive = prioritizedIds
      .map(id => activeTodos.find(t => t.id === id))
      .filter((t): t is Todo => t !== undefined);
      
    // Handle any tasks that might have been dropped by AI error (fallback)
    const processedIds = new Set(reorderedActive.map(t => t.id));
    const missing = activeTodos.filter(t => !processedIds.has(t.id));
    
    setTodos([...reorderedActive, ...missing, ...completedTodos]);
    setIsPrioritizing(false);
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'ACTIVE') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="bg-indigo-600 text-white p-2 rounded-xl">
                <Layers className="w-6 h-6" />
              </span>
              ZenTask AI
            </h1>
            <p className="mt-2 text-slate-500">Organize your life with intelligent assistance.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                {(['ALL', 'ACTIVE', 'COMPLETED'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === f 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
             </div>
          </div>
        </header>

        {/* Stats Section */}
        <Stats todos={todos} />

        <div className="grid lg:grid-cols-1 gap-8">
            {/* Main Todo List */}
            <main>
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 overflow-hidden border border-white/50">
                    <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50/50 via-white to-white">
                        <AddTodo onAdd={addTodo} />
                        
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <ListTodo className="w-5 h-5 text-indigo-500"/>
                                Your Tasks
                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                                    {filteredTodos.length}
                                </span>
                            </h2>
                            
                            {filter !== 'COMPLETED' && todos.some(t => !t.completed) && (
                                <button
                                    onClick={handleSmartPrioritize}
                                    disabled={isPrioritizing}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isPrioritizing ? (
                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Zap className="w-4 h-4" />
                                    )}
                                    Smart Sort
                                </button>
                            )}
                        </div>

                        <div className="space-y-1">
                            {filteredTodos.length > 0 ? (
                                filteredTodos.map(todo => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        onToggle={toggleTodo}
                                        onDelete={deleteTodo}
                                        onAddSubtasks={addSubtasks}
                                        onToggleSubtask={toggleSubtask}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-gray-900 font-medium">No tasks found</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {filter === 'COMPLETED' 
                                            ? "You haven't completed any tasks yet." 
                                            : "Add a new task to get started!"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
      </div>
    </div>
  );
};

export default App;