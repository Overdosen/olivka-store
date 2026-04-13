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
              padding: "30px 20px", // Зменшено падінги для мобільних
              cursor: "default",
              width: "calc(100% - 2rem)",
              maxWidth: "560px",
              margin: "0 auto",
              borderRadius: "12px",
              boxShadow: "0 30px 100px rgba(0,0,0,0.2)",
              border: "1px solid rgba(82,79,37,0.15)",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column"
            }}
            className="md:p-[60px]" // Відновлено великі падінги на десктопі
          >
            <button 
              onClick={close}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#524f25]/5 text-[#524f25]/40 hover:text-[#524f25] transition-all active:scale-90"
              aria-label="Закрити"
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: "24px", marginTop: "10px" }}>
              <h3 className="font-serif text-2xl md:text-3xl text-[#524f25] leading-tight text-center px-6">{title}</h3>
            </div>
            
            <div className="text-justify font-sans text-[#524f25]/80 leading-relaxed text-sm md:text-base mb-6">
              {children}
            </div>

            <div className="shrink-0 border-t border-[#524f25]/5 flex justify-center items-center pt-6 mt-auto">
              <button
                onClick={close}
                className="w-full md:w-auto md:min-w-[300px] py-4 md:py-5 px-12 rounded-xl bg-[#524f25] text-white text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#3d3b1c] transition-all shadow-xl active:scale-95"
              >
                ЗАКРИТИ
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

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
