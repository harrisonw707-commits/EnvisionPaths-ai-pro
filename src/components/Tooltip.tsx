import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-theme-surface border border-theme rounded-lg shadow-xl z-[1100] whitespace-nowrap"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">{content}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-theme" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
