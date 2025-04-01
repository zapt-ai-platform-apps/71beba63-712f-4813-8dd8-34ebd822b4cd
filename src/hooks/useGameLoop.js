import { useState, useEffect, useRef } from 'react';

export function useGameLoop(isPlaying) {
  const [time, setTime] = useState(0);
  const [deltaTime, setDeltaTime] = useState(0);
  const lastTimeRef = useRef(0);
  const frameIdRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      return;
    }

    const startTime = performance.now();
    
    const tick = (currentTime) => {
      const delta = (currentTime - lastTimeRef.current) / 1000; // convert to seconds
      setDeltaTime(delta);
      setTime((prevTime) => prevTime + delta);
      lastTimeRef.current = currentTime;
      frameIdRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    frameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isPlaying]);

  return { time, deltaTime };
}