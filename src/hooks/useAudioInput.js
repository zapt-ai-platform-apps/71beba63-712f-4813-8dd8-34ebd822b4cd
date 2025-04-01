import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/browser';

export function useAudioInput() {
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isRecording) return;

    const setupAudio = async () => {
      try {
        console.log('Setting up audio input...');
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 2048;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = context.createMediaStreamSource(stream);
        source.connect(analyserNode);
        
        setAudioContext(context);
        setAnalyser(analyserNode);
        setAudioData(new Float32Array(analyserNode.fftSize));
        setError(null);
        console.log('Audio input setup complete');
      } catch (err) {
        console.error('Error setting up audio:', err);
        Sentry.captureException(err);
        setError(err.message);
        setIsRecording(false);
      }
    };

    setupAudio();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setAnalyser(null);
    }
  };

  const getAudioData = () => {
    if (analyser && audioData) {
      analyser.getFloatTimeDomainData(audioData);
      return audioData;
    }
    return null;
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    getAudioData,
    error,
  };
}