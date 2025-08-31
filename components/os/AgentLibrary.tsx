import React from 'react';
import { useOS } from '../../contexts/OSContext';
import { ModalType } from '../../types';
import Modal from '../shared/Modal';
import { PlusIcon } from '../../assets/icons';

const AgentLibrary: React.FC = () => {
  const { osState, dispatch, setActiveModal } = useOS();

  const handleCreate = (agentId: string, agentName: string) => {
    dispatch({ type: 'PROMPT_CREATE_ASSET', payload: { agentId, agentName } });
  };

  return (
    <Modal title="创建新资产" icon={PlusIcon} onClose={() => setActiveModal(ModalType.NONE)}>
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.values(osState.installedAgents).map(agent => (
          <div 
            key={agent.id}
            onClick={() => handleCreate(agent.id, agent.name)}
            className="group p-4 bg-secondary/50 hover:bg-muted rounded-xl border border-border/80 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            role="button"
            aria-label={`创建 ${agent.name}`}
          >
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