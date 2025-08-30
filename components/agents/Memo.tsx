
import React, { useState, useEffect } from 'react';
import { AgentComponentProps } from '../../types';

const MemoAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
  const [content, setContent] = useState(instance.state.content || '');
  
  // Use a debounce effect to avoid updating state on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      if (instance.state.content !== content) {
        updateState({ ...instance.state, content });
      }
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [content, instance.state, updateState]);
  
  return (
    <div className="w-full h-full flex flex-col">
      <textarea
        className="w-full h-full p-2 bg-transparent text-gray-800 resize-none border-none focus:ring-0 text-base leading-relaxed"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="开始书写..."
      />
    </div>
  );
};

export default MemoAgent;
