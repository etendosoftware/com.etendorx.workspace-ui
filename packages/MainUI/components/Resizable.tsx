import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export const Resizable = ({ children }: React.PropsWithChildren) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const windowRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      if (isDraggingRef.current && windowRef.current) {
        const newX = e.clientX - offsetRef.current.x;
        const newY = e.clientY - offsetRef.current.y;
        setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const currentRef = windowRef.current;
    currentRef?.addEventListener("mousemove", handleMouseMove);
    currentRef?.addEventListener("mouseup", handleMouseUp);
    currentRef?.addEventListener("mouseleave", handleMouseUp);

    return () => {
      currentRef?.removeEventListener("mousemove", handleMouseMove);
      currentRef?.removeEventListener("mouseup", handleMouseUp);
      currentRef?.removeEventListener("mouseleave", handleMouseUp);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: { clientX: number; clientY: number }) => {
      isDraggingRef.current = true;
      offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    },
    [position.x, position.y],
  );

  const toggleMaximize = useCallback(() => setIsMaximized((prev) => !prev), []);
  const toggleMinimize = useCallback(() => setIsMinimized((prev) => !prev), []);

  const closeWindow = useCallback(() => {
    if (windowRef.current) {
      windowRef.current.style.display = "none";
    }
  }, []);

  const handleResize = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const newWidth = e.clientX - position.x;
      const newHeight = e.clientY - position.y;
      setSize({ width: Math.max(200, newWidth), height: Math.max(150, newHeight) });
    },
    [position.x, position.y],
  );

  return (
    <motion.div
      ref={windowRef}
      className={"bg-white w-full shadow-lg rounded-lg border overflow-hidden z-[2000]"}
      style={{
        top: position.y,
        height: isMaximized ? "100%" : size.height,
      }}>
      <div
        className="flex items-center justify-end bg-gray-800 text-white p-2 cursor-move select-none"
        onMouseDown={handleMouseDown}>
        <div className="flex gap-2">
          <button type="button" onClick={toggleMinimize}>
            _
          </button>
          <button type="button" onClick={toggleMaximize}>
            []
          </button>
          <button type="button" onClick={closeWindow}>
            X
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="p-4 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" onMouseDown={handleResize} />
    </motion.div>
  );
};

export default Resizable;
