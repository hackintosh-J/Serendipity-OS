import React from 'react';
import { useOS } from '../../contexts/OSContext';
import { ModalType } from '../../types';
import Modal from '../shared/Modal';
import { PlusIcon, TrashIcon } from '../../assets/icons';

const AgentLibrary: React.FC = () => {
  const { osState, dispatch, setActiveModal } = useOS();

  const handleCreate = (agentId: string, agentName: string) => {
    dispatch({ type: 'PROMPT_CREATE_ASSET', payload: { agentId, agentName } });
  };
  
  const handleDeleteAgent = (e: React.MouseEvent, agentId: string, agentName: string) => {
    e.stopPropagation();
    const isAgentInUse = Object.values(osState.activeAssets).some(asset => asset.agentId === agentId);
    if (isAgentInUse) {
        alert(`无法删除代理 "${agentName}": 仍有使用此代理的活动资产存在。请先删除所有相关资产。`);
        return;
    }

    if (window.confirm(`您确定要永久删除代理 "${agentName}" 吗？此操作无法撤销。`)) {
        dispatch({ type: 'UNINSTALL_AGENT', payload: { agentId } });
    }
  };

  return (
    <Modal title="创建新资产" icon={PlusIcon} onClose={() => setActiveModal(ModalType.NONE)}>
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.values(osState.installedAgents)
          .filter(agent => agent.id !== 'agent.system.insight')
          .sort((a, b) => (a.isDeletable ? 1 : -1) - (b.isDeletable ? 1 : -1) || a.name.localeCompare(b.name))
          .map(agent => (
          <div 
            key={agent.id}
            onClick={() => handleCreate(agent.id, agent.name)}
            className="group relative p-4 bg-secondary/50 hover:bg-muted rounded-xl border border-border/80 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            role="button"
            aria-label={`创建 ${agent.name}`}
          >
            {agent.isDeletable && (
                <button 
                    onClick={(e) => handleDeleteAgent(e, agent.id, agent.name)}
                    className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground bg-secondary/0 hover:bg-destructive/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title={`删除代理 "${agent.name}"`}
                    aria-label={`删除代理 "${agent.name}"`}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-12 h-12 bg-card rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
                <agent.icon className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">{agent.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AgentLibrary;