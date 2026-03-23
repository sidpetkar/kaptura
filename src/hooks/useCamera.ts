import { useState, useRef, useCallback } from 'react';

export function useCamera() {
  const [active, setActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const currentDeviceIdx = useRef(0);

  const enumerateDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    devicesRef.current = all.filter((d) => d.kind === 'videoinput');
  }, []);

  const startWithConstraints = useCallback(async (constraints: MediaStreamConstraints) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    setActive(true);
    await enumerateDevices();
    return stream;
  }, [enumerateDevices]);

  const start = useCallback(async () => {
    return startWithConstraints({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
  }, [startWithConstraints]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    const devices = devicesRef.current;
    if (devices.length <= 1) {
      console.warn('Only one camera available');
      return;
    }

    currentDeviceIdx.current = (currentDeviceIdx.current + 1) % devices.length;
    const deviceId = devices[currentDeviceIdx.current].deviceId;

    return startWithConstraints({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
  }, [startWithConstraints]);

  return { videoRef, streamRef, active, start, stop, switchCamera };
}
