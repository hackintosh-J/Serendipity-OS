import React from 'react';
import { useOS } from '../../contexts/OSContext';
// FIX: Import Variants type from framer-motion to correctly type the animation variants.
import { motion, Variants } from 'framer-motion';
import { XIcon, WifiIcon, BluetoothIcon, MoonIcon, SunIcon } from '../../assets/icons';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// FIX: Add Variants type annotation to resolve type inference error with 'spring' transition type.
const panelVariants: Variants = {
  hidden: { y: '-100%', opacity: 0.8 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 180 } },
  exit: { y: '-100%', opacity: 0.8, transition: { type: 'spring', damping: 25, stiffness: 180 } },
};

const ControlCenter: React.FC = () => {
  const { osState, setControlCenterOpen, toggleTheme } = useOS();
  const isDarkMode = osState.settings.theme === 'dark';

  const ControlButton: React.FC<{ icon: React.FC<{className?: string}>; label: string; active?: boolean; onClick?: () => void; }> = ({ icon: Icon, label, active, onClick }) => (
    <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={onClick}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-blue-500 text-white' : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200'}`}>
            <Icon className="w-7 h-7" />
        </div>
        <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );

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
        className="absolute top-4 left-4 right-4 p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid grid-cols-4 gap-4 mb-6">
            <ControlButton icon={WifiIcon} label="Wi-Fi" active />
            <ControlButton icon={BluetoothIcon} label="蓝牙" active />
            <ControlButton icon={MoonIcon} label="勿扰" />
            <ControlButton icon={isDarkMode ? SunIcon : MoonIcon} label={isDarkMode ? '浅色' : '深色'} active={isDarkMode} onClick={toggleTheme} />
        </div>

        <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">亮度</label>
            <div className="relative mt-2">
                <div className="h-2 w-full bg-gray-200/80 dark:bg-gray-600/80 rounded-full"></div>
                <div className="h-2 w-3/4 bg-blue-500 rounded-full absolute top-0"></div>
                <div className="w-5 h-5 bg-white rounded-full shadow-md absolute top-1/2 -translate-y-1/2" style={{left: '75%'}}></div>
            </div>
        </div>

        <button 
            onClick={() => setControlCenterOpen(false)} 
            className="absolute top-3 right-3 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            aria-label="关闭控制中心"
        >
            <XIcon className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ControlCenter;