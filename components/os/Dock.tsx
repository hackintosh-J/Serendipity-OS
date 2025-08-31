import React from 'react';
import { useOS } from '../../contexts/OSContext';
import { SparklesIcon, SettingsIcon, PlusIcon, ClockIcon, TrashIcon, UploadIcon, GridIcon } from '../../assets/icons';
import { ModalType } from '../../types';
import Settings from './Settings';
import AgentLibrary from './AgentLibrary';
import CreateAssetPrompt from './CreateAssetPrompt';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { motion, AnimatePresence } from 'framer-motion';

const DockButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string; }> = ({ onClick, children, 'aria-label': ariaLabel }) => (
  <motion.button
    onClick={onClick}
    aria-label={ariaLabel}
    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-glass backdrop-blur-lg text-foreground shadow-md"
    whileHover={{ scale: 1.1, y: -5, transition: { type: 'spring', stiffness: 300 } }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.button>
);


const InsightHistoryModal: React.FC = () => {
    const { osState, setActiveModal, deleteArchivedInsight, restoreArchivedInsight } = useOS();
    const { insightHistory } = osState;

    return (
        <Modal title="洞察历史" icon={ClockIcon} onClose={() => setActiveModal(ModalType.NONE)}>
            <div className="p-4 sm:p-6">
                {insightHistory.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">没有已存档的洞察。</p>
                        <p className="text-sm text-muted-foreground/80 mt-2">当您在AI洞察卡片中点击“存档”后，它们会出现在这里。</p>
                    </div>
                ) : (
                    <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {insightHistory.slice().reverse().map(asset => (
                            <li key={asset.id} className="bg-secondary/50 p-4 rounded-lg shadow-sm">
                                <h3 className="font-semibold text-card-foreground mb-2">{asset.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{asset.state.content}</p>
                                {asset.state.generated_image && (
                                    <img 
                                        src={`data:image/jpeg;base64,${asset.state.generated_image}`} 
                                        alt="AI generated visual for insight" 
                                        className="w-full rounded-md mb-4"
                                    />
                                )}
                                <div className="flex justify-end items-center space-x-3 border-t border-border/50 pt-3 mt-3">
                                    <span className="text-xs text-muted-foreground">存档于: {new Date(asset.updatedAt).toLocaleString()}</span>
                                    <div className="flex-grow" />
                                    <Button onClick={() => restoreArchivedInsight(asset.id)} icon={UploadIcon} size="sm" variant="secondary">恢复至桌面</Button>
                                    <Button onClick={() => deleteArchivedInsight(asset.id)} icon={TrashIcon} size="sm" variant="secondary">删除</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
};


const Dock: React.FC = () => {
  const { osState, setActiveModal, setAIPanelState, setCurrentView } = useOS();

  const handleAIToggle = () => {
    setAIPanelState(osState.ui.aiPanelState === 'panel' ? 'closed' : 'panel');
  }

  const handleViewToggle = () => {
    const nextView = osState.ui.currentView === 'desktop' ? 'glance' : 'desktop';
    setCurrentView(nextView);
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
                className="flex items-center justify-center p-2 bg-glass backdrop-blur-xl rounded-3xl shadow-lg"
              >
                 <div className="flex items-center space-x-2">
                  <DockButton onClick={handleAIToggle} aria-label="打开AI助手">
                      <SparklesIcon className="w-8 h-8" />
                  </DockButton>
                   <DockButton onClick={() => setActiveModal(ModalType.AGENT_LIBRARY)} aria-label="创建新资产">
                      <PlusIcon className="w-7 h-7" />
                  </DockButton>
                  <DockButton onClick={handleViewToggle} aria-label="切换视图">
                      <GridIcon className="w-7 h-7" />
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
        {osState.ui.activeModal === ModalType.INSIGHT_HISTORY && <InsightHistoryModal />}
      </AnimatePresence>
    </>
  );
};

export default Dock;