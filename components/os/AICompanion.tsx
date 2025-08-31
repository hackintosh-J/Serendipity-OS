import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../contexts/OSContext';
import { geminiService } from '../../services/geminiService';
import { AgentDefinition } from '../../types';
import { SparklesIcon, ChevronDownIcon, SendIcon } from '../../assets/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  thinkingText?: string;
  isThinking?: boolean;
}

const AIPanel: React.FC = () => {
  const { osState, dispatch, setAIPanelState, createAsset, deleteAsset, triggerInsightGeneration } = useOS();
  const { ui, settings } = osState;
  const { aiPanelState, isAIBusy } = ui;
  const [messages, setMessages] = useState<Message[]>([]);
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
    const userMessage: Message = { id: `msg-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`, sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);

    const apiKey = settings.geminiApiKey;

    if (!geminiService.isConfigured(apiKey)) {
      const aiMessage: Message = { id: `msg-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`, sender: 'ai', text: 'AI服务当前不可用。请前往“设置”并提供您的 Gemini API 密钥。' };
      setMessages(prev => [...prev, aiMessage]);
      return;
    }
    
    const aiMessageId = `msg-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
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
              case 'GENERATE_INSIGHT':
                  triggerInsightGeneration();
                  responseTexts.push(`好的，我正在为您准备一个新的洞察...完成后它会出现在您的桌面上。`);
                  break;
              case 'CREATE_ASSET':
                  if (payload.agentId === 'agent.system.insight') {
                      triggerInsightGeneration();
                      responseTexts.push(`好的，我正在为您准备一个新的洞察...完成后它会出现在您的桌面上。`);
                  } else {
                      createAsset(payload.agentId, payload.name, payload.initialState);
                      responseTexts.push(`好的，我已经为您创建了“${payload.name}”。`);
                  }
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
              case 'READ_ASSET_STATE': {
                  const assetToRead = Object.values(osState.activeAssets).find(a => a.name.toLowerCase().includes(payload.assetName.toLowerCase()));
                  if (assetToRead) {
                      const context = JSON.stringify(assetToRead.state, null, 2);
                      const question = payload.question || prompt;
                      const newPrompt = `基于以下上下文信息，请回答用户的问题。\n\n上下文:\n\`\`\`json\n${context}\n\`\`\`\n\n问题: ${question}`;
                      
                      try {
                          const ai = new GoogleGenAI({ apiKey: apiKey! });
                          const result = await ai.models.generateContent({
                              model: 'gemini-2.5-flash',
                              contents: newPrompt,
                          });
                          responseTexts.push(result.text);
                      } catch (e: any) {
                          responseTexts.push(`在处理您的请求时出现错误: ${e.message}`);
                      }
                  } else {
                      responseTexts.push(`抱歉，我没有找到名为“${payload.assetName}”的资产。`);
                  }
                  break;
              }
              case 'UPDATE_ASSET_ORDER':
                if (payload.order && Array.isArray(payload.order)) {
                    const currentIds = new Set(Object.keys(osState.activeAssets));
                    const newIds = new Set(payload.order);
                    if (currentIds.size === newIds.size && [...currentIds].every(id => newIds.has(id as string))) {
                        dispatch({ type: 'UPDATE_ASSET_ORDER', payload: payload.order });
                        responseTexts.push(`好的，我已经重新整理了您的桌面。`);
                    } else {
                        responseTexts.push(`抱歉，整理桌面时出现错误：资产列表不匹配。`);
                    }
                } else {
                    responseTexts.push(`抱歉，整理桌面时出现错误：无效的顺序。`);
                }
                break;
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
  }, [osState, createAsset, deleteAsset, dispatch, settings.geminiApiKey, triggerInsightGeneration]);

  useEffect(() => {
    if (aiPanelState === 'panel') {
      if (messages.length === 0) {
        setMessages([{ id: `msg-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`, sender: 'ai', text: `你好，${settings.userName}！有什么可以帮您？` }]);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [aiPanelState, settings.userName, messages.length]);


  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (trimmedInput === '' || isAIBusy) {
        if (isAIBusy) {
            const busyMessage: Message = { id: `msg-${Date.now()}`, sender: 'ai', text: 'AI正在处理其他任务，请稍后重试。' };
            setMessages(prev => [...prev, busyMessage]);
        }
        return;
    };
    setInput('');
    
    dispatch({ type: 'SET_AI_BUSY', payload: true });
    try {
        await processAIResponse(trimmedInput);
    } finally {
        dispatch({ type: 'SET_AI_BUSY', payload: false });
        inputRef.current?.focus();
    }
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
            className="absolute bottom-0 left-0 right-0 h-[55vh] p-4 flex flex-col items-center bg-card-glass backdrop-blur-2xl shadow-2xl border border-border/50 rounded-t-3xl z-30"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        >
            {/* Chat History Panel */}
            <div className="w-full max-w-2xl flex-grow mb-4 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"><SparklesIcon className="w-5 h-5" /></div>}
                        <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none shadow-sm'}`}>
                            {msg.isThinking && (
                                <div className="mb-2 border-b border-border/50 pb-2">
                                    <button onClick={() => setIsThinkingCollapsed(prev => !prev)} className="flex items-center justify-between w-full text-xs text-muted-foreground font-semibold">
                                        思考中...
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${!isThinkingCollapsed && 'rotate-180'}`} />
                                    </button>
                                    <AnimatePresence>
                                        {!isThinkingCollapsed && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap"
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

            {/* The Input Bar that animates from the Dock */}
            <motion.div
                layoutId="ai-input-bar"
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                className="w-full max-w-2xl h-20 bg-glass backdrop-blur-xl rounded-3xl shadow-lg flex items-center p-3 flex-shrink-0"
            >
                 <button onClick={() => setAIPanelState('closed')} className="w-14 h-14 mr-2 rounded-2xl bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-colors flex-shrink-0 flex items-center justify-center">
                    <ChevronDownIcon className="w-6 h-6" />
                </button>
                <div className="relative w-full h-full">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isAIBusy ? "AI正在思考..." : "与我交谈或下达指令..."}
                        className="w-full h-full text-lg bg-background/50 text-foreground border-none focus:ring-2 focus:ring-primary rounded-2xl placeholder:text-muted-foreground px-4"
                        disabled={isAIBusy}
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={input.trim() === '' || isAIBusy} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground disabled:bg-muted transition-colors flex-shrink-0 flex items-center justify-center"
                        aria-label="发送消息"
                    >
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIPanel;