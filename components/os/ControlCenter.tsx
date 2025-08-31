import React from 'react';
import { useOS } from '../../contexts/OSContext';
// FIX: Remove `Variants` import as it's causing a type resolution error.
import { motion } from 'framer-motion';
import { XIcon, WifiIcon, BluetoothIcon, MoonIcon, SunIcon, SparklesIcon, ClockIcon } from '../../assets/icons';
import { ModalType } from '../../types';

// FIX: Removed `: Variants` type annotation.
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// FIX: Removed `: Variants` type annotation.
const panelVariants = {
  hidden: { y: '-100%', opacity: 0.8 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 180 } },
  exit: { y: '-100%', opacity: 0.8, transition: { type: 'spring' as const, damping: 25, stiffness: 180 } },
};

const ControlCenter: React.FC = () => {
  const { osState, setControlCenterOpen, toggleThemeMode, triggerInsightGeneration, setActiveModal } = useOS();
  const isDarkMode = osState.settings.themeMode === 'dark';

  const ControlButton: React.FC<{ icon: React.FC<{className?: string}>; label: string; active?: boolean; onClick?: () => void; }> = ({ icon: Icon, label, active, onClick }) => (
    <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={onClick}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-accent text-accent-foreground' : 'bg-secondary/80 text-secondary-foreground'}`}>
            <Icon className="w-7 h-7" />
        </div>
        <span className="text-xs text-foreground">{label}</span>
    </div>
  );
  
  const handleGetInsight = () => {
    triggerInsightGeneration();
    setControlCenterOpen(false);
  }

  const handleShowHistory = () => {
    setActiveModal(ModalType.INSIGHT_HISTORY);
    setControlCenterOpen(false);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50"
      onClick={() => setControlCenterOpen(false)}
    >
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute top-4 left-4 right-4 p-6 bg-card-glass backdrop-blur-2xl rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid grid-cols-4 gap-4 mb-6">
            <ControlButton icon={SparklesIcon} label="获取新洞察" onClick={handleGetInsight} />
            <ControlButton icon={ClockIcon} label="历史洞察" onClick={handleShowHistory} />
            <ControlButton icon={isDarkMode ? SunIcon : MoonIcon} label={isDarkMode ? '浅色' : '深色'} active={isDarkMode} onClick={toggleThemeMode} />
            <ControlButton icon={WifiIcon} label="Wi-Fi" active />

        </div>

        <div>
            <label className="text-sm font-medium text-foreground">亮度</label>
            <div className="relative mt-2">
                <div className="h-2 w-full bg-secondary/80 rounded-full"></div>
                <div className="h-2 w-3/4 bg-accent rounded-full absolute top-0"></div>
                <div className="w-5 h-5 bg-card rounded-full shadow-md absolute top-1/2 -translate-y-1/2" style={{left: '75%'}}></div>
            </div>
        </div>

        <button 
            onClick={() => setControlCenterOpen(false)} 
            className="absolute top-3 right-3 p-2 rounded-full text-muted-foreground hover:bg-secondary/80 transition-colors"
            aria-label="关闭控制中心"
        >
            <XIcon className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ControlCenter;