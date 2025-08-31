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
            id: `todo-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`,
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
                            className="flex items-center p-3 bg-card-glass rounded-lg shadow-sm"
                        >
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer bg-secondary"
                            />
                            <span className={`flex-grow mx-3 text-foreground break-words ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {todo.text}
                            </span>
                            <button 
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
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
                        <p className="text-muted-foreground">列表为空，请添加新的待办事项。</p>
                    </div>
                )}
            </div>
            <form onSubmit={handleAddTodo} className="flex-shrink-0 p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        placeholder="添加新的待办事项..."
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button type="submit" className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        添加
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TodoAgent;