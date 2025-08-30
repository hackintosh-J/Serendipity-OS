

import React from 'react';
import { useOS } from '../../contexts/OSContext.tsx';
import AgentWindow from './AgentWindow.tsx';

const WindowManager: React.FC = () => {
  const { osState, dispatch, closeAssetView } = useOS();
  const { viewingAssetId } = osState.ui;

  if (!viewingAssetId) {
    return null;
  }

  const asset = osState.activeAssets[viewingAssetId];
  const agent = asset ? osState.installedAgents[asset.agentId] : null;

  if (!asset || !agent) {
    if (viewingAssetId) {
        closeAssetView();
    }
    return null;
  }
  
  const updateState = (newState: any) => {
      dispatch({ type: 'UPDATE_ASSET_STATE', payload: { assetId: asset.id, newState }});
  }

  return <AgentWindow asset={asset} agent={agent} updateState={updateState} close={closeAssetView} />;
};

export default WindowManager;