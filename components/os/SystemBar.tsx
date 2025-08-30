

import React, { useState, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { WifiIcon, BatteryIcon } from '../../assets/icons';

const SystemBar: React.FC = () => {
  const { osState } = useOS();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <header className="w-full h-8 bg-gray-100/80 backdrop-blur-sm flex items-center justify-between px-4 text-sm text-gray-800 shadow-sm z-50 flex-shrink-0">
      <div className="font-semibold">Serendipity OS</div>
      <div>{osState.settings.userName}</div>
      <div className="flex items-center space-x-3">
        <span>{formatTime(currentTime)}</span>
        <div className="flex items-center space-x-2">
            <WifiIcon className="w-4 h-4" />
            <BatteryIcon className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};

export default SystemBar;