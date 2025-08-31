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
        className="relative w-full max-w-2xl bg-card-glass backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="h-14 flex-shrink-0 bg-muted/70 flex items-center justify-between px-5 border-b border-border">
            <div className="flex items-center space-x-2">
                <Icon className="w-6 h-6 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <XIcon className="w-5 h-5" />
            </button>
        </header>
        <div className="flex-grow overflow-y-auto max-h-[70vh]">
            {children}
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;