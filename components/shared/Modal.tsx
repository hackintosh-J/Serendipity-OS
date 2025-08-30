import React, { ReactNode } from 'react';
import { XIcon } from '../../assets/icons';
import { motion } from 'framer-motion';

interface ModalProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  onClose: () => void;
  children: ReactNode;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
};

const Modal: React.FC<ModalProps> = ({ title, icon: Icon, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        className="fixed inset-0" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      ></motion.div>
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="h-14 flex-shrink-0 bg-gray-100/70 flex items-center justify-between px-5 border-b border-gray-200/80">
            <div className="flex items-center space-x-2">
                <Icon className="w-6 h-6 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors">
                <XIcon className="w-5 h-5" />
            </button>
        </header>
        <div className="flex-grow overflow-y-auto">
            {children}
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;