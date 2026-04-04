import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Використовуємо індивідуальні компоненти для іконок
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
const IconChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IconChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const IconInstagram = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
const IconMail = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconExternalLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>;
const IconLoader = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>;

export default function InfoModal({ isOpen, onClose, title, type, src, maxWidth }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      if (type === 'text_file' && typeof src === 'string') {
        const fetchText = async () => {
          setLoading(true);
          try {
            const response = await fetch(src);
            if (!response.ok) throw new Error('Load failed');
            const text = await response.text();
            setTextContent(text);
          } catch (err) {
            console.error('InfoModal Error:', err);
            setTextContent('Не вдалося завантажити вміст документа.');
          } finally {
            setLoading(false);
          }
        };
        fetchText();
      }
    }
  }, [isOpen, type, src]);

  const images = Array.isArray(src) ? src : [];
  
  const handleNext = () => {
    if (images.length > 0) setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const handlePrev = () => {
    if (images.length > 0) setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderContent = (text) => {
    if (!text || typeof text !== 'string') return null;

    return text.split('\n').map((line, i) => {
      let currentLine = line;
      let iconMarkup = null;

      if (line.toLowerCase().includes('instagram:')) {
        iconMarkup = <IconInstagram />;
        currentLine = line.replace(/instagram:/i, '').trim();
      } else if (line.toLowerCase().includes('e-mail:') || line.toLowerCase().includes('email:')) {
        iconMarkup = <IconMail />;
        currentLine = line.replace(/e-mail:|email:/i, '').trim();
      }

      const urlMatch = currentLine.match(/https?:\/\/[^\s]+/);
      
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return (
        <div key={i} className="flex items-start gap-4 mb-4 last:mb-0">
          {iconMarkup && <span className="mt-1 text-[#524f25]/60 shrink-0 h-6 w-6 flex items-center justify-center">{iconMarkup}</span>}
          <div className="flex-1 min-w-0 text-[#524f25]/90">
            {urlMatch ? (
              <p>
                <span dangerouslySetInnerHTML={{ __html: formattedLine.split(urlMatch[0])[0] }} />
                <a 
                  href={urlMatch[0]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#c4a882] underline hover:text-[#524f25] break-all inline-flex items-center gap-2 transition-colors font-medium decoration-[#c4a882]/40"
                >
                  {urlMatch[0].replace('https://', '').replace(/\/$/, '')}
                  <span className="scale-[0.8] opacity-70"><IconExternalLink /></span>
                </a>
                <span dangerouslySetInnerHTML={{ __html: formattedLine.split(urlMatch[0])[1] }} />
              </p>
            ) : (
              <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formattedLine }} />
            )}
          </div>
        </div>
      );
    });
  };

  const maxWidthClass = maxWidth || (type === 'carousel' ? 'max-w-lg' : 'max-w-4xl');

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-container"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3"
        >
          {/* Backdrop - анімуємо окремо для плавності розмиття */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Window */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`relative w-full ${maxWidthClass} h-fit bg-[#faf5ee] rounded-xl shadow-2xl overflow-hidden flex flex-col`}
            style={{ maxHeight: '95vh' }}
          >
            {/* Header */}
            <div className="px-8 py-6 bg-[#faf5ee] sticky top-0 z-20 flex justify-center items-center shrink-0 border-b border-[#524f25]/10">
              <h2 className="text-xl md:text-2xl font-serif text-[#524f25] text-center flex items-center gap-4">
                {(type === 'pdf' || type === 'text_file') && <IconFileText />}
                {title}
              </h2>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-white/40 custom-scrollbar-minimal">
              {type === 'pdf' && (
                <div className="p-4 md:p-8 flex justify-center">
                  <div className="h-[65vh] md:h-[75vh] w-full bg-white rounded overflow-hidden">
                    <iframe src={`${src}#toolbar=0`} className="w-full h-full border-none" title={title} />
                  </div>
                </div>
              )}

              {type === 'carousel' && (
                <div className="relative group w-full h-[65vh] md:h-[80vh] flex items-center justify-center bg-stone-200/20">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentIndex}
                      src={images[currentIndex]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full object-contain"
                      alt={title}
                    />
                  </AnimatePresence>
                  
                  {images.length > 1 && (
                    <>
                      <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-xl bg-white shadow-lg z-30 active:scale-90"><IconChevronLeft /></button>
                      <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-xl bg-white shadow-lg z-30 active:scale-90"><IconChevronRight /></button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                        {images.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-[#524f25] w-5' : 'bg-[#524f25]/30 w-1.5'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {(type === 'text_file' || type === 'static_text') && (
                <div 
                  className="max-w-4xl mx-auto w-full"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                >
                  <div style={{ height: '50px' }} />
                  
                  <div className="text-[#524f25]/90 text-base md:text-xl leading-relaxed space-y-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20"><IconLoader /></div>
                    ) : (
                      renderContent(type === 'text_file' ? textContent : src)
                    )}
                  </div>

                  <div style={{ height: '50px' }} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 shrink-0 bg-[#faf5ee] border-t border-[#524f25]/5 flex justify-center items-center sticky bottom-0 z-20">
              <button
                onClick={onClose}
                className="w-full md:w-auto md:min-w-[300px] py-5 px-12 rounded-xl bg-[#524f25] text-white text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#3d3b1c] transition-all shadow-xl active:scale-95"
              >
                ЗАКРИТИ
              </button>
            </div>
          </motion.div>

          <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar-minimal::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar-minimal::-webkit-scrollbar-thumb { background: rgba(82, 79, 37, 0.1); border-radius: 10px; }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
