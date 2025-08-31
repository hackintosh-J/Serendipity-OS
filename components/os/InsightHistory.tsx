
import React from 'react';
import { useOS } from '../../contexts/OSContext';
import { ModalType } from '../../types';
import { ClockIcon, UploadIcon, TrashIcon } from '../../assets/icons';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

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

export default InsightHistoryModal;
