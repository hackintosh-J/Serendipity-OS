

import React from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from './AgentBubble';
import { motion, AnimatePresence } from 'framer-motion';

const Desktop: React.FC = () => {
  const { osState } = useOS();

  const sortedAssets = Object.values(osState.activeAssets)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="h-full w-full bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 overflow-y-auto p-4 sm:p-6 md:p-8">
      <motion.div layout className="max-w-3xl mx-auto grid gap-6">
        <AnimatePresence>
          {sortedAssets.map(asset => (
            <AgentBubble key={asset.id} asset={asset} />
          ))}
        </AnimatePresence>
         {sortedAssets.length === 0 && (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold text-gray-700">空空如也</h2>
                <p className="text-gray-500 mt-2">点击下方的 AI 图标开始创建你的第一个智能资产吧！</p>
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default Desktop;