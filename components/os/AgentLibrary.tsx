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
            className="group p-4 bg-white/50 hover:bg-white/90 rounded-xl border border-gray-200/80 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            role="button"
            aria-label={`创建 ${agent.name}`}
          >
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-12 h-12 bg-white rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
                <agent.icon className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">{agent.name}</h3>
            </div>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AgentLibrary;