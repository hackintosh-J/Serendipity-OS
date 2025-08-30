

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
            className="group p-4 bg-white/50 hover:bg-white/90 dark:bg-gray-700/40 dark:hover:bg-gray-700/80 rounded-xl border border-gray-200/80 dark:border-gray-600/80 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            role="button"
            aria-label={`创建 ${agent.name}`}
          >
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-12 h-12 bg-white dark:bg-gray-600 rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
                <agent.icon className="w-7 h-7 text-gray-700 dark:text-gray-200" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{agent.name}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{agent.description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AgentLibrary;