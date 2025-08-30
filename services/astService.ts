
import { OSState, ActiveAssetInstance } from '../types.ts';

class ASTService {
  private cleanupStateForExport(state: OSState): any {
    const stateToSave = JSON.parse(JSON.stringify(state));
    
    // Remove non-serializable or transient data
    delete stateToSave.isInitialized;
    delete stateToSave.ui;

    // Remove component and icon functions from agents
    if (stateToSave.installedAgents) {
        Object.keys(stateToSave.installedAgents).forEach(key => {
            delete stateToSave.installedAgents[key].component;
            delete stateToSave.installedAgents[key].icon;
        });
    }

    return stateToSave;
  }

  public exportSystemState(state: OSState) {
    try {
      const exportableState = this.cleanupStateForExport(state);
      const stateJson = JSON.stringify(exportableState, null, 2);
      const blob = new Blob([stateJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serendipity_os_backup_${new Date().toISOString()}.ast`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export system state:", error);
      alert("导出系统状态失败！");
    }
  }

  public exportAsset(asset: ActiveAssetInstance, agentDefinition: any) {
     try {
      const agentDefToExport = { ...agentDefinition };
      delete agentDefToExport.component;
      delete agentDefToExport.icon;

      const exportableAsset = {
        asset,
        agentDefinition: agentDefToExport,
      };

      const assetJson = JSON.stringify(exportableAsset, null, 2);
      const blob = new Blob([assetJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.name}.ast_bubble`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export asset:", error);
      alert("导出活动资产失败！");
    }
  }


  public importStateFromFile(file: File): Promise<Partial<OSState>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const importedData = JSON.parse(result);
            
            // Basic validation
            if (importedData.settings && importedData.activeAssets) {
              resolve(importedData as Partial<OSState>);
            } else if (importedData.asset && importedData.agentDefinition) {
              // This is an ast_bubble file
              const singleAssetImport: Partial<OSState> = {
                  installedAgents: { [importedData.agentDefinition.id]: importedData.agentDefinition },
                  activeAssets: { [importedData.asset.id]: importedData.asset }
              };
              resolve(singleAssetImport);
            }
            else {
              reject(new Error("无效的 .ast 或 .ast_bubble 文件格式。"));
            }
          } else {
            reject(new Error("无法读取文件内容。"));
          }
        } catch (error) {
          reject(new Error(`解析文件失败: ${error instanceof Error ? error.message : String(error)}`));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`读取文件时出错: ${error}`));
      };
      reader.readAsText(file);
    });
  }
}

export const astService = new ASTService();