import { useState, useRef, useEffect, useCallback } from 'react';
import {
  PaperPlaneRight, SpinnerGap, Check, X, ImageSquare,
} from '@phosphor-icons/react';
import { AIEditSession, isAIConfigured, type AIEditResult } from '../services/geminiAI';

interface ChatEntry {
  role: 'user' | 'ai';
  text: string;
  model?: string;
}

interface Props {
  getCanvasBlob: () => Promise<Blob | null>;
  imageWidth: number;
  imageHeight: number;
  onPreview: (blob: Blob) => void;
  onAccept: (blob: Blob) => void;
  onCancel: () => void;
  onEditingChange?: (editing: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function AIPanel({
  getCanvasBlob, imageWidth, imageHeight,
  onPreview, onAccept, onCancel, onEditingChange, onLoadingChange,
}: Props) {
  const sessionRef = useRef<AIEditSession>(new AIEditSession());
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<Blob | null>(null);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const configured = isAIConfigured();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    sessionRef.current.start();
    return () => { sessionRef.current.end(); };
  }, []);

  useEffect(() => {
    if (!prompt && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [prompt]);

  const handleSend = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setError(null);
    setChatHistory((prev) => [...prev, { role: 'user', text: trimmed }]);
    setPrompt('');
    setLoading(true);
    onLoadingChange?.(true);

    try {
      const isFirst = sessionRef.current.turnCount === 0;
      let sourceBlob: Blob | null = null;
      if (isFirst) {
        sourceBlob = await getCanvasBlob();
        if (!sourceBlob) throw new Error('Could not capture canvas image');
      }

      const refBlobs = refImages.length > 0
        ? await Promise.all(refImages.map((f) => f.slice()))
        : undefined;

      const result: AIEditResult = await sessionRef.current.sendMessage(
        trimmed,
        sourceBlob ?? undefined,
        refBlobs,
        imageWidth,
        imageHeight,
      );

      if (refImages.length > 0) {
        setRefImages([]);
        setRefPreviews((prev) => { prev.forEach(URL.revokeObjectURL); return []; });
      }

      const aiText = result.text || (result.imageBlob ? 'Edit applied.' : 'No changes returned.');
      setChatHistory((prev) => [...prev, {
        role: 'ai',
        text: aiText,
        model: result.model === 'gemini-3-pro-image-preview' ? 'Pro' : 'Flash',
      }]);

      if (result.imageBlob) {
        setPendingResult(result.imageBlob);
        onPreview(result.imageBlob);
        onEditingChange?.(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI request failed';
      setError(msg);
      sessionRef.current.end();
      sessionRef.current.start();
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [prompt, loading, getCanvasBlob, refImages, imageWidth, imageHeight, onPreview, onEditingChange, onLoadingChange]);

  const handleAccept = useCallback(() => {
    if (!pendingResult) return;
    onAccept(pendingResult);
    setPendingResult(null);
    onEditingChange?.(false);
    sessionRef.current.end();
    sessionRef.current.start();
    setChatHistory([]);
  }, [pendingResult, onAccept, onEditingChange]);

  const handleReject = useCallback(() => {
    setPendingResult(null);
    onCancel();
    onEditingChange?.(false);
    sessionRef.current.end();
    sessionRef.current.start();
    setChatHistory([]);
  }, [onCancel, onEditingChange]);

  const handleAddRef = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 14 - refImages.length);
    setRefImages((prev) => [...prev, ...newFiles]);
    setRefPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }, [refImages.length]);

  const removeRef = useCallback((idx: number) => {
    setRefPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 76)}px`;
  }, []);

  if (!configured) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-muted/60 tracking-wider">
          AI editing requires a Gemini API key.
        </p>
        <p className="text-xs text-muted/40 mt-2 tracking-wider">
          Add VITE_GEMINI_API_KEY to your .env file
        </p>
      </div>
    );
  }

  if (pendingResult) {
    return (
      <div className="px-4 py-4 max-w-[600px] mx-auto">
        <div className="flex items-center justify-between py-2">
          <button onClick={handleReject} className="text-accent/80 p-2">
            <X size={22} weight="bold" />
          </button>
          <span className="text-[12px] tracking-widest text-amber-400 font-medium">
            AI Edit
          </span>
          <button onClick={handleAccept} className="text-accent p-2">
            <Check size={22} weight="bold" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-[600px] mx-auto w-full" style={{ maxHeight: 260 }}>
      {chatHistory.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">
          {chatHistory.map((entry, i) => (
            <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-1.5 text-[12px] tracking-normal leading-relaxed ${
                  entry.role === 'user'
                    ? 'bg-amber-400/15 text-accent'
                    : 'bg-white/5 text-muted/80'
                }`}
              >
                {entry.text}
                {entry.model && (
                  <span className="ml-2 text-[10px] text-muted/40 tracking-wider">{entry.model}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {error && (
        <button
          onClick={() => setError(null)}
          className="mx-4 my-1.5 px-3 py-2 bg-red-400/10 rounded-lg text-left"
        >
          <p className="text-[12px] text-red-400/90 leading-relaxed">{error}</p>
          <p className="text-[10px] text-muted/30 mt-1">Tap to dismiss</p>
        </button>
      )}

      {refPreviews.length > 0 && (
        <div className="px-4 py-1.5 flex gap-2 overflow-x-auto">
          {refPreviews.map((src, i) => (
            <div key={i} className="relative shrink-0">
              <img src={src} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <button
                onClick={() => removeRef(i)}
                className="absolute -top-1 -right-1 bg-surface rounded-full p-0.5"
              >
                <X size={10} weight="bold" className="text-muted/60" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-end bg-white/5 rounded-xl border border-white/8">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your edit..."
            rows={1}
            className="flex-1 bg-transparent text-[12px] tracking-normal text-accent placeholder:text-muted/30 px-3 py-2.5 resize-none outline-none leading-snug overflow-y-auto"
            style={{ maxHeight: 76, scrollbarWidth: 'none' }}
            disabled={loading}
          />
          <button
            onClick={handleAddRef}
            className="shrink-0 p-2 text-muted/40 hover:text-muted/60 transition-colors"
            title="Attach reference image"
          >
            <ImageSquare size={18} weight="bold" />
          </button>
          <button
            onClick={handleSend}
            disabled={!prompt.trim() || loading}
            className={`shrink-0 p-2.5 transition-colors ${
              loading ? 'text-amber-400' : prompt.trim() ? 'text-amber-400' : 'text-muted/20'
            }`}
          >
            {loading ? (
              <SpinnerGap size={18} weight="bold" className="animate-spin" />
            ) : (
              <PaperPlaneRight size={18} weight="fill" />
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
