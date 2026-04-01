import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

export default function TextBorderAnimation({ text = "Programming", className }) {
  const [isHoveredIn, setIsHoveredIn] = useState(false);
  const [isHoveredOut, setIsHoveredOut] = useState(false);

  const handleHover = () => {
    setIsHoveredIn(true);
  };

  const handleHoverExit = () => {
    setIsHoveredIn(false);
    setIsHoveredOut(true);
  };

  useEffect(() => {
    if (isHoveredOut) {
      const timer = setTimeout(() => {
        setIsHoveredOut(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isHoveredOut]);

  return (
    <div onMouseEnter={handleHover} onMouseLeave={handleHoverExit} className="overflow-hidden relative inline-block">
      <span className={cn("transition-colors duration-300", className)}>{text}</span>
      <div className="absolute left-0 bottom-0 h-[2px] w-full overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-full bg-[#524f25] transition-transform duration-300",
            isHoveredIn
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0",
          )}
        ></div>
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-full translate-x-0 bg-[#524f25] opacity-0 transition-transform duration-300",
            isHoveredOut && "translate-x-full opacity-100",
          )}
        ></div>
      </div>
    </div>
  );
}
