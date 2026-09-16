// src/components/FloatingWindow.jsx

import React, { useRef, useState, useEffect, useCallback } from 'react';

const MIN_WIDTH = 240;
const MIN_HEIGHT = 140;
const CLOSE_ANIM_MS = 280;
const EDGE_MARGIN = 60;

export default function FloatingWindow({
  id,
  title,
  position,
  onClose,
  onMove,
  onResize,
  onFocus,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, startWidth: 0, startHeight: 0 });
  const windowRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, CLOSE_ANIM_MS);
  }, [isClosing, onClose]);

  const getMaxWidth = () => window.innerWidth * 0.95;
  const getMaxHeight = () => window.innerHeight * 0.9;

  /* ============================================================
     Drag — pointer events (cobrem mouse + touch + caneta)
     ============================================================ */
  const handleDragPointerDown = useCallback((e) => {
    if (isBooting || isClosing) return;
    if (e.target.closest?.('.floating-window-close')) return;
    onFocus?.();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    e.preventDefault();
  }, [position.x, position.y, onFocus, isBooting, isClosing]);

  /* ============================================================
     Resize
     ============================================================ */
  const handleResizePointerDown = useCallback((e) => {
    if (isBooting || isClosing) return;
    onFocus?.();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      startWidth: position.width,
      startHeight: position.height,
    };
    e.preventDefault();
    e.stopPropagation();
  }, [position.width, position.height, onFocus, isBooting, isClosing]);

  /* ============================================================
     Listener global durante drag/resize
     ============================================================ */
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMoveEvent = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const newX = Math.max(
          -position.width + EDGE_MARGIN,
          Math.min(dragStart.current.startX + dx, window.innerWidth - EDGE_MARGIN)
        );
        const newY = Math.max(
          0,
          Math.min(dragStart.current.startY + dy, window.innerHeight - 40)
        );
        onMove({ x: newX, y: newY });
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(resizeStart.current.startWidth + dx, getMaxWidth())
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(resizeStart.current.startHeight + dy, getMaxHeight())
        );
        onResize({ width: newWidth, height: newHeight });
      }
    };

    const onUpEvent = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('pointermove', onMoveEvent);
    window.addEventListener('pointerup', onUpEvent);
    window.addEventListener('pointercancel', onUpEvent);

    return () => {
      window.removeEventListener('pointermove', onMoveEvent);
      window.removeEventListener('pointerup', onUpEvent);
      window.removeEventListener('pointercancel', onUpEvent);
    };
  }, [isDragging, isResizing, onMove, onResize, position.width]);

  /* ============================================================
     Clamp quando a janela do browser muda de tamanho
     ============================================================ */
  useEffect(() => {
    const onResize = () => {
      const { x, y } = position;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + EDGE_MARGIN < 0) newX = vw - EDGE_MARGIN;
      else if (x > vw - EDGE_MARGIN) newX = vw - EDGE_MARGIN;

      if (y + 40 < 0) newY = vh - 40;
      else if (y > vh - 40) newY = vh - 40;

      if (newX !== x || newY !== y) {
        onMove({ x: newX, y: newY });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [position, onMove]);

  const className = [
    'floating-window-container',
    isBooting ? 'window-booting' : '',
    isClosing ? 'window-closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={windowRef}
      className={className}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        zIndex: 100,
      }}
      onPointerDown={() => !isBooting && !isClosing && onFocus?.()}
    >
      <div
        className="floating-window-header"
        onPointerDown={handleDragPointerDown}
        style={{ touchAction: 'none' }}
      >
        <span className="floating-window-title">{title}</span>
        <span
          className="floating-window-close"
          onClick={handleClose}
          title="Fechar"
        >✕</span>
      </div>
      <div className="floating-window-body">
        {children}
      </div>
      <div
        className="floating-window-resize-handle"
        onPointerDown={handleResizePointerDown}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}