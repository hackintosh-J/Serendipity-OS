
import React from 'react';
import { AgentComponentProps } from '../../types';
import { SendIcon } from '../../assets/icons';

const BrowserAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
  const { url, inputValue } = instance.state;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ ...instance.state, inputValue: e.target.value });
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let newUrl = inputValue;
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      newUrl = 'https://' + newUrl;
    }
    updateState({ ...instance.state, url: newUrl });
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-200 -m-4">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-300/80 p-2 flex items-center gap-2">
        <form onSubmit={handleNavigate} className="flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="输入网址并按 Enter"
            className="w-full px-3 py-1.5 bg-white/80 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </form>
        <button onClick={handleOpenInNewTab} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">在新标签页打开</button>
      </header>
      <div className="flex-grow relative">
        <iframe
          src={url}
          title={instance.name}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
          onError={() => console.warn(`Iframe navigation error to: ${url}`)}
        />
         <div className="absolute inset-x-0 bottom-4 flex justify-center px-4 pointer-events-none">
            <div className="bg-black/60 text-white text-xs rounded-full px-3 py-1.5 pointer-events-auto">
              注意：由于安全限制，部分网站（如 Google, GitHub）可能无法在此处加载。
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserAgent;