
import React, { useState, useRef, ChangeEvent } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion } from 'framer-motion';
import { SparklesIcon, ClockIcon, MoonIcon, SunIcon, UploadIcon, DownloadIcon } from '../../assets/icons';
import { ModalType } from '../../types';
import { astService } from '../../services/astService';
import { themes } from '../../styles/themes';
import Button from '../shared/Button';
import Input from '../shared/Input';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { y: '-100%' },
  visible: { y: '0%', transition: { type: 'spring' as const, damping: 35, stiffness: 250 } },
  exit: { y: '-100%', transition: { type: 'spring' as const, damping: 35, stiffness: 250 } },
};

const ControlCenter: React.FC = () => {
  const { osState, dispatch, setControlCenterOpen, toggleThemeMode, triggerInsightGeneration, setActiveModal, setTheme } = useOS();
  const { settings } = osState;
  const isDarkMode = settings.themeMode === 'dark';

  const [userName, setUserName] = useState(settings.userName);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    // Save any changed settings before closing
    if (userName !== settings.userName || geminiApiKey !== settings.geminiApiKey) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { userName, geminiApiKey } });
    }
    setControlCenterOpen(false);
  };
  
  const handleGetInsight = () => {
    triggerInsightGeneration();
    handleClose();
  };

  const handleShowHistory = () => {
    setActiveModal(ModalType.INSIGHT_HISTORY);
    handleClose();
  };
  
  const handleExport = () => {
    astService.exportSystemState(osState);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("导入状态将会合并到您当前的系统中。您确定要继续吗？")) {
        return;
    }

    try {
        const importedState = await astService.importStateFromFile(file);
        dispatch({ type: 'IMPORT_STATE', payload: importedState });
        alert("状态导入成功！");
        handleClose();
    } catch (error) {
        console.error("Import failed:", error);
        alert(`导入失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const ControlButton: React.FC<{ icon: React.FC<{className?: string}>; label: string; active?: boolean; onClick?: () => void; }> = ({ icon: Icon, label, active, onClick }) => (
    <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={onClick}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary/80 text-secondary-foreground'}`}>
            <Icon className="w-7 h-7" />
        </div>
        <span className="text-xs text-foreground">{label}</span>
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
      onClick={handleClose}
    >
      <motion.div
        variants={panelVariants}
        className="absolute inset-x-0 top-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 pt-12 max-h-screen overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-card-glass backdrop-blur-2xl rounded-3xl shadow-2xl p-6 space-y-6">
                
                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-4">
                    <ControlButton icon={SparklesIcon} label="获取新洞察" onClick={handleGetInsight} />
                    <ControlButton icon={ClockIcon} label="历史洞察" onClick={handleShowHistory} />
                    <ControlButton icon={isDarkMode ? SunIcon : MoonIcon} label={isDarkMode ? '浅色' : '深色'} active={isDarkMode} onClick={toggleThemeMode} />
                </div>
                
                {/* Personalization Section */}
                <div className="bg-secondary/50 p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold text-foreground">个性化</h3>
                     <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-foreground mb-1">用户名</label>
                        <Input id="userName" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="您希望AI如何称呼您？"/>
                    </div>
                     <div className="flex items-center justify-between">
                        <label htmlFor="themeSelector" className="text-sm font-medium text-foreground">主题</label>
                        <select 
                            id="themeSelector"
                            value={settings.themeName}
                            onChange={(e) => setTheme(e.target.value)}
                            className="px-3 py-1.5 bg-input/80 border border-border rounded-lg text-sm"
                        >
                            {Object.keys(themes).map(key => (
                                <option key={key} value={key}>{themes[key].light.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* System & Data Section */}
                <div className="bg-secondary/50 p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold text-foreground">系统与数据</h3>
                     <div>
                        <label htmlFor="geminiApiKey" className="block text-sm font-medium text-foreground mb-1">Gemini API 密钥</label>
                        <Input id="geminiApiKey" type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="在此输入您的 API 密钥"/>
                    </div>
                    <div className="flex space-x-4">
                        <Button onClick={handleExport} icon={DownloadIcon} size="sm" variant="secondary">导出状态</Button>
                        <Button onClick={handleImportClick} icon={UploadIcon} size="sm" variant="secondary">导入状态</Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".ast,.astb" className="hidden" />
                    </div>
                </div>

                 <div className="flex justify-center pt-4">
                    <button onClick={handleClose} className="px-8 py-2 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg">
                        完成
                    </button>
                 </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ControlCenter;