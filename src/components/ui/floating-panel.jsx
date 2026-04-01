import React, { createContext, useContext, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";


const FloatingPanelContext = createContext(null);

export const FloatingPanelRoot = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FloatingPanelContext.Provider value={{ isOpen, open, close }}>
      {children}
    </FloatingPanelContext.Provider>
  );
};

export const FloatingPanelTrigger = ({ children, className }) => {
  const { open } = useContext(FloatingPanelContext);
  return (
    <div onClick={open} className={cn("cursor-pointer h-full", className)}>
      {children}
    </div>
  );
};

export const FloatingPanelContent = ({ children, title }) => {
  const { isOpen, close } = useContext(FloatingPanelContext);

  const overlay = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="floating-panel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={close}
        >
          {/* Clicking INSIDE the panel does NOT close it */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              backgroundColor: "#faf5ee",
              padding: "60px",
              cursor: "default",
              width: "calc(100% - 2rem)",
              maxWidth: "560px",
              margin: "0 auto",
              borderRadius: "12px",
              boxShadow: "0 30px 100px rgba(0,0,0,0.2)",
              border: "1px solid rgba(82,79,37,0.15)",
            }}
          >
            <div style={{ marginBottom: "32px" }}>
              <h3 className="font-serif text-3xl text-[#524f25] leading-tight text-center">{title}</h3>
            </div>
            <div className="text-justify font-sans text-[#524f25]/80 leading-relaxed text-base">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(overlay, document.body);
};

export const FloatingPanelBody = ({ children }) => <>{children}</>;
export const FloatingPanelHeader = ({ children }) => <div className="mb-4">{children}</div>;
export const FloatingPanelFooter = ({ children }) => <div className="mt-6 flex justify-end">{children}</div>;
export const FloatingPanelCloseButton = () => {
  const { close } = useContext(FloatingPanelContext);
  return (
    <button onClick={close} className="p-2 rounded-full hover:bg-black/5 transition-colors">
      <X size={20} />
    </button>
  );
};
