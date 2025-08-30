import React from 'react';
import { useOS } from '../../contexts/OSContext';
import { SparklesIcon, SettingsIcon, PlusIcon } from '../../assets/icons';
import { ModalType } from '../../types';
import Settings from './Settings';
import AgentLibrary from './AgentLibrary';
import CreateAssetPrompt from './CreateAssetPrompt';
import { motion, AnimatePresence } from 'framer-motion';

const DockButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string; }> = ({ onClick, children, 'aria-label': ariaLabel }) => (
  <motion.button
    onClick={onClick}
    aria-label={ariaLabel}
    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/50 backdrop-blur-lg text-gray-800 shadow-md"
    whileHover={{ scale: 1.1, y: -5, transition: { type: 'spring', stiffness: 300 } }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.button>
);

const Dock: React.FC = () => {
  const { osState, setActiveModal, setAIPanelState } = useOS();

  const handleAIToggle = () => {
    setAIPanelState(osState.ui.aiPanelState === 'panel' ? 'closed' : 'panel');
  }

  return (
    <>
      <AnimatePresence>
        {osState.ui.aiPanelState !== 'panel' && (
            <motion.footer 
              id="main-dock" 
              className="w-full flex justify-center items-center p-4 z-40 flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            >
              <motion.div 
                layoutId="ai-input-bar"
                className="flex items-center justify-center p-2 bg-white/30 backdrop-blur-xl rounded-3xl shadow-lg"
              >
                 <div className="flex items-center space-x-4">
                  <DockButton onClick={handleAIToggle} aria-label="打开AI助手">
                      <SparklesIcon className="w-8 h-8" />
                  </DockButton>
                   <DockButton onClick={() => setActiveModal(ModalType.AGENT_LIBRARY)} aria-label="创建新资产">
                      <PlusIcon className="w-7 h-7" />
                  </DockButton>
                  <DockButton onClick={() => setActiveModal(ModalType.SETTINGS)} aria-label="打开设置">
                      <SettingsIcon className="w-7 h-7" />
                  </DockButton>
                </div>
              </motion.div>
            </motion.footer>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {osState.ui.activeModal === ModalType.SETTINGS && <Settings />}
        {osState.ui.activeModal === ModalType.AGENT_LIBRARY && <AgentLibrary />}
        {osState.ui.activeModal === ModalType.CREATE_ASSET_PROMPT && <CreateAssetPrompt />}
      </AnimatePresence>
    </>
  );
};

export default Dock;