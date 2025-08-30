import React from 'react';
import { AgentComponentProps } from '../../types.ts';

const HelpAgent: React.FC<AgentComponentProps> = () => {
  const content = `# 欢迎来到 Serendipity OS！

这是一个基于 **AI原生交互** 和 **智能代理（Agent）** 范式的未来派移动操作系统。

---

## 核心理念

### 1. AI即界面 (AI as Interface)
与传统的点击图标不同，您的主要交互方式是与AI助手进行自然语言对话。您可以让它帮您创建资产、查找信息或执行任务。

*   **试试看:** 点击Dock栏的 ✨ 图标，对AI说：“创建一个叫'我的点子'的备忘录”。

### 2. Agent即应用 (Agent as Application)
我们用“智能代理（Agent）”取代了传统的“App”。您在桌面上看到的每一个“气泡”，都是一个包含自身数据和功能的独立应用实例，我们称之为 **“活动资产 (Active Asset, AA)”**。

*   **创建:** 点击Dock栏的 **+** 图标，从代理库中选择一个代理来创建新的资产。
*   **交互:** 单击气泡打开它，拖动气泡来整理桌面。
*   **状态保持:** 对资产的所有修改都会被自动实时保存。关闭窗口只是让它“休眠”，并不会丢失任何数据。

### 3. 情景即文件系统 (Context as Filesystem)
告别繁琐的文件夹！Serendipity OS 旨在未来通过AI根据时间、项目、地点等上下文自动组织和呈现您的资产。您无需再手动管理文件。

---

## 关键功能

### 资产管理
*   **导出:** 在打开的资产窗口中，点击下载图标可以将该资产导出为一个 \`.ast_bubble\` 文件，方便分享给他人。
*   **删除:** 您可以请求AI助手来删除一个资产，例如：“删除‘我的点子’备忘录”。

### 系统备份与恢复
*   **前往设置 (⚙️):** 您可以一键将整个操作系统的当前状态（所有资产和设置）导出为一个 \`.ast\` 文件进行备份。
*   **导入:** 同样在设置中，您可以从 \`.ast\` 或 \`.ast_bubble\` 文件恢复或导入数据。

---

祝您探索愉快！
  `;

  // FIX: Improved markdown renderer to correctly handle bold and inline code.
  // This resolves the original reported error which was likely a toolchain parsing issue,
  // and fixes the visual rendering of the help content.
  const renderContent = () => {
    const processLine = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    };

    return content.split('\n').map((line, index) => {
      if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b">{line.substring(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-2 mb-4">{line.substring(2)}</h1>;
      if (line.startsWith('*   ')) {
        return <li key={index} className="ml-6 list-disc text-gray-700" dangerouslySetInnerHTML={{ __html: processLine(line.substring(4)) }} />;
      }
      if (line.trim() === '---') return <hr key={index} className="my-6" />;
      return <p key={index} className="text-gray-700 leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: processLine(line) }} />;
    });
  };

  return (
    <div className="prose max-w-none">
      {renderContent()}
    </div>
  );
};

export default HelpAgent;