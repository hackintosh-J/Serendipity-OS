
import React, { useState, useRef, ChangeEvent } from 'react';
import { useOS } from '../../contexts/OSContext';
import { ModalType, OSState } from '../../types';
import Modal from '../shared/Modal';
import { SettingsIcon, UploadIcon, DownloadIcon } from '../../assets/icons';
import { astService } from '../../services/astService';
import Button from '../shared/Button';
import Input from '../shared/Input';

const Settings: React.FC = () => {
  const { osState, dispatch, setActiveModal } = useOS();
  const [userName, setUserName] = useState(osState.settings.userName);
  // FIX: Removed state for Gemini API key as it's no longer configured through the UI.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      // FIX: Removed geminiApiKey from the saved settings payload.
      payload: { userName },
    });
    alert("设置已保存！");
    setActiveModal(ModalType.NONE);
  };
  
  const handleExport = () => {
    astService.exportSystemState(osState);
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  }
  
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
        setActiveModal(ModalType.NONE);
    } catch (error) {
        console.error("Import failed:", error);
        alert(`导入失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <Modal title="系统设置" icon={SettingsIcon} onClose={() => setActiveModal(ModalType.NONE)}>
      <div className="p-6 space-y-6">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <Input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="您希望AI如何称呼您？"
          />
        </div>
        {/* FIX: Removed the entire Gemini API Key input section. */}
        
        <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">系统状态管理</h3>
            <p className="text-sm text-gray-600">您可以将整个操作系统的当前状态（包括所有资产和设置）导出为一个 `.ast` 文件进行备份，或从文件中恢复。</p>
            <div className="flex space-x-4">
                <Button onClick={handleExport} icon={DownloadIcon}>导出系统状态</Button>
                <Button onClick={handleImportClick} icon={UploadIcon} variant="secondary">导入系统状态</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".ast,.ast_bubble" className="hidden" />
            </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t flex justify-end">
        <Button onClick={handleSave}>保存设置</Button>
      </div>
    </Modal>
  );
};

export default Settings;