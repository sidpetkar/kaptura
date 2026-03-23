import { useRef, useEffect, useCallback } from 'react';
import { WebGLRenderer } from '../engine/webgl';
import type { ParsedLUT } from '../types';

export function useWebGL(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rendererRef = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new WebGLRenderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [canvasRef]);

  const uploadImage = useCallback((source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap) => {
    rendererRef.current?.uploadImage(source);
  }, []);

  const uploadLUT = useCallback((lut: ParsedLUT) => {
    rendererRef.current?.uploadLUT(lut);
  }, []);

  const clearLUT = useCallback(() => {
    rendererRef.current?.clearLUT();
  }, []);

  const render = useCallback(() => {
    rendererRef.current?.render();
  }, []);

  const startVideoLoop = useCallback((video: HTMLVideoElement) => {
    rendererRef.current?.startVideoLoop(video);
  }, []);

  const stopVideoLoop = useCallback(() => {
    rendererRef.current?.stopVideoLoop();
  }, []);

  const resize = useCallback((w: number, h: number) => {
    rendererRef.current?.resize(w, h);
  }, []);

  const toBlob = useCallback(() => {
    return rendererRef.current?.toBlob() ?? Promise.reject(new Error('No renderer'));
  }, []);

  return { uploadImage, uploadLUT, clearLUT, render, startVideoLoop, stopVideoLoop, resize, toBlob, rendererRef };
}
