import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../contexts/OSContext';
import { geminiService } from '../../services/geminiService';
import { AgentDefinition } from '../../types';
import { SparklesIcon, ChevronDownIcon, SendIcon } from '../../assets/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  thinkingText?: string;
  isThinking?: boolean;
}

const AIPanel: React.FC = () => {
  const { osState, dispatch, setAIPanelState, createAsset, deleteAsset } = useOS();
  // FIX: Property 'settings' does not exist on type 'UIState'.
  const { ui: { aiPanelState }, settings } = osState;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(true);
  const [input, setInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const processAIResponse = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setInput('');
    const userMessage: Message = { id: crypto.randomUUID(), sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);

    const apiKey = settings.geminiApiKey;

    if (!geminiService.isConfigured(apiKey)) {
      const aiMessage: Message = { id: crypto.randomUUID(), sender: 'ai', text: 'AI服务当前不可用。请前往“设置”并提供您的 Gemini API 密钥。' };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      return;
    }
    
    const aiMessageId = crypto.randomUUID();
    let currentAiMessage: Message = { id: aiMessageId, sender: 'ai', text: '', thinkingText: '', isThinking: true };
    setMessages(prev => [...prev, currentAiMessage]);
    
    const stream = geminiService.generateActionStream(prompt, osState, apiKey);
    let finalResponseText = '';

    for await (const event of stream) {
      if (event.type === 'thinking') {
          currentAiMessage = {...currentAiMessage, thinkingText: event.content };
          setMessages(prev => prev.map(m => m.id === aiMessageId ? currentAiMessage : m));
      } else if (event.type === 'result') {
          currentAiMessage = {...currentAiMessage, isThinking: false };
          
          let actions = [];
          if (event.content.actions) {
            actions = event.content.actions;
          } else if (event.content.action) {
            actions = [event.content]; // Handle single action response
          }
          
          let responseTexts: string[] = [];

          for (const actionItem of actions) {
            const { action, payload } = actionItem;
            switch (action) {
              case 'CREATE_ASSET':
                  createAsset(payload.agentId, payload.name, payload.initialState);
                  responseTexts.push(`好的，我已经为您创建了“${payload.name}”。`);
                  break;
              case 'FIND_AND_UPDATE_ASSET': {
                  const assetToUpdate = Object.values(osState.activeAssets).find(a => 
                      a.name.toLowerCase().includes(payload.assetName.toLowerCase())
                  );
                  if (assetToUpdate) {
                      dispatch({ type: 'UPDATE_ASSET_STATE', payload: { assetId: assetToUpdate.id, newState: payload.newState } });
                      responseTexts.push(`好的，我已经更新了“${payload.assetName}”。`);
                  } else {
                      responseTexts.push(`抱歉，我没有找到名为“${payload.assetName}”的资产来更新。`);
                  }
                  break;
              }
              case 'DELETE_ASSET': {
                  const assetToDelete = Object.values(osState.activeAssets).find(a => a.name.toLowerCase().includes(payload.assetName.toLowerCase()));
                  if (assetToDelete) {
                      deleteAsset(assetToDelete.id);
                      responseTexts.push(`好的，我已经删除了“${payload.assetName}”。`);
                  } else {
                      responseTexts.push(`抱歉，我没有找到名为“${payload.assetName}”的资产。`);
                  }
                  break;
              }
              case 'ANSWER_QUESTION':
                  responseTexts.push(payload.answer);
                  break;
              default:
                  responseTexts.push("抱歉，我无法理解这个指令。");
            }
          }
          finalResponseText = responseTexts.join('\n');
           currentAiMessage.text = finalResponseText;
           setMessages(prev => prev.map(m => m.id === aiMessageId ? currentAiMessage : m));
           
      } else if (event.type === 'error') {
           currentAiMessage = {...currentAiMessage, isThinking: false, text: event.content };
           setMessages(prev => prev.map(m => m.id === aiMessageId ? currentAiMessage : m));
      }
    }
     // Simulate streaming text effect for the final combined message
     if (finalResponseText) {
        const words = finalResponseText.split(/(\s+)/);
        let streamedText = '';
        for (const word of words) {
            streamedText += word;
            setMessages(prev => prev.map(m => m.id === aiMessageId ? {...currentAiMessage, text: streamedText} : m));
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }


    setIsLoading(false);
    inputRef.current?.focus();
  }, [osState, createAsset, deleteAsset, dispatch, settings.geminiApiKey]);

  useEffect(() => {
    if (aiPanelState === 'panel') {
      if (messages.length === 0) {
        setMessages([{ id: crypto.randomUUID(), sender: 'ai', text: `你好，${settings.userName}！有什么可以帮您？` }]);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    } else if (aiPanelState === 'closed') {
      // Reset state when panel is closed but don't clear messages immediately
      // to allow for exit animation.
    }
  }, [aiPanelState, settings.userName, messages.length]);


  const handleSend = () => {
    if (input.trim() === '' || isLoading) return;
    processAIResponse(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const isPanelVisible = aiPanelState === 'panel';

  return (
    <AnimatePresence>
      {isPanelVisible && (
        <motion.div
            className="absolute bottom-0 left-0 right-0 h-[45vh] p-4 pt-0 flex flex-col items-center bg-transparent z-30"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        >
            {/* Chat History Panel */}
            <div className="w-full max-w-2xl flex-grow mb-4 overflow-hidden">
                <div className="w-full h-full overflow-y-auto p-4 space-y-4 rounded-2xl bg-gray-50/80 backdrop-blur-xl shadow-2xl border border-gray-200/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5" /></div>}
                            <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                                {msg.isThinking && (
                                    <div className="mb-2 border-b border-gray-300 pb-2">
                                        <button onClick={() => setIsThinkingCollapsed(prev => !prev)} className="flex items-center justify-between w-full text-xs text-gray-500 font-semibold">
                                            思考中...
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${!isThinkingCollapsed && 'rotate-180'}`} />
                                        </button>
                                        <AnimatePresence>
                                            {!isThinkingCollapsed && (
                                                <motion.p 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-xs text-gray-600 mt-2 whitespace-pre-wrap"
                                                >
                                                    {msg.thinkingText}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                <p className="text-sm break-words whitespace-pre-wrap">{msg.text || (msg.isThinking ? '' : '...')}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* The Input Bar that animates from the Dock */}
            <motion.div
                layoutId="ai-input-bar"
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                className="w-full max-w-2xl h-20 bg-white/30 backdrop-blur-xl rounded-3xl shadow-lg flex items-center p-3 flex-shrink-0"
            >
                 <button onClick={() => setAIPanelState('closed')} className="w-14 h-14 mr-2 rounded-2xl bg-gray-200/50 text-gray-600 hover:bg-gray-300/70 transition-colors flex-shrink-0 flex items-center justify-center">
                    <ChevronDownIcon className="w-6 h-6" />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isLoading ? "AI正在思考..." : "与我交谈或下达指令..."}
                    className="w-full h-full text-lg bg-transparent text-gray-800 border-none focus:ring-0 placeholder-gray-500 px-3"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend} 
                    disabled={input.trim() === '' || isLoading} 
                    className="w-14 h-14 ml-2 rounded-2xl bg-purple-600 text-white disabled:bg-gray-300 transition-colors flex-shrink-0 flex items-center justify-center"
                    aria-label="发送消息"
                >
                    <SendIcon className="w-6 h-6"/>
                </button>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIPanel;