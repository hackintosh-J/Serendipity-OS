import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../contexts/OSContext';
import { ModalType } from '../../types';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';

const CreateAssetPrompt: React.FC = () => {
    const { osState, createAsset, setActiveModal } = useOS();
    const { assetCreationData } = osState.ui;
    const agentDef = assetCreationData ? osState.installedAgents[assetCreationData.agentId] : null;

    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (assetCreationData) {
            setName(`新的 ${assetCreationData.agentName}`);
            // Focus the input field when the modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [assetCreationData]);

    if (!assetCreationData || !agentDef) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            createAsset(assetCreationData.agentId, name.trim());
            setActiveModal(ModalType.NONE);
        }
    };

    return (
        <Modal 
            title={`创建 ${assetCreationData.agentName}`} 
            icon={agentDef.icon} 
            onClose={() => setActiveModal(ModalType.NONE)}
        >
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <label htmlFor="assetName" className="block text-sm font-medium text-gray-700 mb-2">
                        为您的新资产命名:
                    </label>
                    <Input
                        ref={inputRef}
                        id="assetName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={`例如：我的${assetCreationData.agentName}`}
                    />
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={() => setActiveModal(ModalType.NONE)}>
                        取消
                    </Button>
                    <Button type="submit">
                        创建
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateAssetPrompt;