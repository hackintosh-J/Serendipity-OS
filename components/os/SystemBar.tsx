import React, { useState, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { WifiIcon, BatteryIcon } from '../../assets/icons';
import { motion, AnimatePresence } from 'framer-motion';

const SystemBar: React.FC = () => {
  const { osState } = useOS();
  const { ui: { insightGenerationStatus, insightGenerationMessage } } = osState;
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

  const isAIWorking = insightGenerationStatus === 'generating' || insightGenerationStatus === 'error';

  return (
    <header className="w-full h-8 bg-glass backdrop-blur-sm flex items-center justify-between px-4 text-sm text-foreground shadow-sm z-50 flex-shrink-0 sticky top-0">
      <div className="font-semibold w-1/3 min-w-0">
        <AnimatePresence mode="wait">
          {isAIWorking ? (
            <motion.div
              key="ai-status"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center text-xs ${insightGenerationStatus === 'error' ? 'text-destructive font-semibold' : 'text-foreground'}`}
            >
              {insightGenerationStatus === 'generating' && (
                <svg className="animate-spin h-4 w-4 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="truncate">{insightGenerationMessage}</span>
            </motion.div>
          ) : (
            <motion.div
              key="os-name"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              Serendipity OS
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="w-1/3 text-center truncate">{osState.settings.userName}</div>
      <div className="flex items-center justify-end space-x-3 w-1/3">
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