
import React, { useState, useEffect } from 'react';
import { AgentComponentProps } from '../../types';

const ClockAgent: React.FC<AgentComponentProps> = ({ instance }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
  };

  const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-4 bg-gradient-to-br from-indigo-800 to-gray-900 rounded-lg -m-4">
        <p className="text-6xl md:text-7xl font-mono font-bold tracking-widest tabular-nums drop-shadow-lg">
            {formatTime(time)}
        </p>
        <p className="text-lg md:text-xl text-indigo-200 mt-2">
            {formatDate(time)}
        </p>
    </div>
  );
};

export default ClockAgent;