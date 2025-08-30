import React, { useState } from 'react';
import { AgentComponentProps } from '../../types';
import { PlusIcon, TrashIcon } from '../../assets/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

const TodoAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
    const { todos = [] } = instance.state;
    const [newTodoText, setNewTodoText] = useState('');

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text: newTodoText.trim(),
            completed: false,
        };

        updateState({ ...instance.state, todos: [...todos, newTodo] });
        setNewTodoText('');
    };
    
    const handleToggleTodo = (id: string) => {
        const updatedTodos = todos.map((todo: Todo) => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        updateState({ ...instance.state, todos: updatedTodos });
    };

    const handleDeleteTodo = (id: string) => {
        const updatedTodos = todos.filter((todo: Todo) => todo.id !== id);
        updateState({ ...instance.state, todos: updatedTodos });
    };

    return (
        <div className="w-full h-full flex flex-col -m-4">
            <div className="flex-grow p-4 overflow-y-auto">
                <ul className="space-y-2">
                    <AnimatePresence>
                    {todos.map((todo: Todo) => (
                        <motion.li 
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                            className="flex items-center p-3 bg-white/80 rounded-lg shadow-sm"
                        >
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className={`flex-grow mx-3 text-gray-800 break-words ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                                {todo.text}
                            </span>
                            <button 
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                aria-label={`删除待办事项 ${todo.text}`}
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </motion.li>
                    ))}
                    </AnimatePresence>
                </ul>
                {todos.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">列表为空，请添加新的待办事项。</p>
                    </div>
                )}
            </div>
            <form onSubmit={handleAddTodo} className="flex-shrink-0 p-4 border-t border-gray-200/80 bg-white/50 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        placeholder="添加新的待办事项..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        添加
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TodoAgent;
