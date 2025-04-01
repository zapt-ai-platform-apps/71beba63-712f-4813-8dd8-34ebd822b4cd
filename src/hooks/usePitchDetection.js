import { useState, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/browser';

// A simple autocorrelation algorithm to detect pitch
function autoCorrelate(buffer, sampleRate) {
  if (!buffer || buffer.length === 0) return -1;
  
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  // Calculate RMS
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Not enough signal
  if (rms < 0.01) return -1;

  // Find ACF peak
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - (correlation / MAX_SAMPLES);
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.5 && bestOffset > 0) {
    // Convert to frequency
    return sampleRate / bestOffset;
  }
  
  return -1;
}

// Convert frequency to standard musical note
function frequencyToNote(frequency) {
  if (frequency < 0) return { note: null, cents: 0 };
  
  // A4 is 440Hz
  const A4 = 440;
  // Semitones away from A4
  const semitones = 12 * Math.log2(frequency / A4);
  // Get nearest note
  const noteIndex = Math.round(semitones) + 9; // A is 9 steps from C
  const octave = Math.floor(noteIndex / 12);
  const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteIndex % 12];
  
  // Calculate cents deviation
  const exactSemitones = 12 * Math.log2(frequency / A4);
  const cents = Math.round((exactSemitones - Math.round(exactSemitones)) * 100);
  
  return {
    note: `${noteName}${octave}`,
    cents,
  };
}

export function usePitchDetection(getAudioData, isRecording) {
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState(null);
  const [cents, setCents] = useState(0);
  const rafId = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!isRecording) {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
  
      const updatePitch = () => {
        const buffer = getAudioData();
        if (buffer) {
          const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);
          if (frequency > 0) {
            setPitch(frequency);
            const { note: detectedNote, cents: detectedCents } = frequencyToNote(frequency);
            setNote(detectedNote);
            setCents(detectedCents);
          }
        }
        rafId.current = requestAnimationFrame(updatePitch);
      };
  
      updatePitch();
    } catch (error) {
      console.error('Error in pitch detection:', error);
      Sentry.captureException(error);
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [getAudioData, isRecording]);

  return { pitch, note, cents };
}