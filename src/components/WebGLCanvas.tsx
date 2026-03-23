import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { WebGLRenderer } from '../engine/webgl';
import type { ParsedLUT } from '../types';

export interface WebGLCanvasHandle {
  renderer: WebGLRenderer | null;
  canvas: HTMLCanvasElement | null;
}

interface Props {
  className?: string;
}

const WebGLCanvas = forwardRef<WebGLCanvasHandle, Props>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new WebGLRenderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    get renderer() {
      return rendererRef.current;
    },
    get canvas() {
      return canvasRef.current;
    },
  }));

  return <canvas ref={canvasRef} className={className} />;
});

WebGLCanvas.displayName = 'WebGLCanvas';
export default WebGLCanvas;
