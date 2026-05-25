import Meyda from 'meyda';
import { detectChord } from './chordTemplates.js';

let audioContext = null;
let source = null;
let meydaAnalyzer = null;
let stream = null;
let onChordDetectedCallback = null;
let onFeaturesCallback = null; // For visualizer
let isRunning = false;

export async function startAudioAnalysis(onChordCallback, onFeaturesCb) {
  if (isRunning) return;
  
  onChordDetectedCallback = onChordCallback;
  onFeaturesCallback = onFeaturesCb;

  try {
    // Request microphone access
    stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaStreamSource(stream);

    // Create Meyda Analyzer
    // bufferSize of 2048 or 4096 is good for frequency resolution, 
    // we use 4096 for better low frequency detection
    meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: audioContext,
      source: source,
      bufferSize: 4096,
      featureExtractors: ['chroma', 'rms'], // 'chroma' is what we need for chords
      callback: (features) => {
        if (features && features.chroma) {
          // detectChord expects a 12-dimensional array
          const detectedChord = detectChord(features.chroma);
          
          if (onChordDetectedCallback) {
            onChordDetectedCallback(detectedChord);
          }
          if (onFeaturesCallback) {
            onFeaturesCallback(features);
          }
        }
      }
    });

    meydaAnalyzer.start();
    isRunning = true;
    return true;

  } catch (error) {
    console.error('Error starting audio analysis:', error);
    return false;
  }
}

export function stopAudioAnalysis() {
  if (meydaAnalyzer) {
    meydaAnalyzer.stop();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  
  isRunning = false;
  meydaAnalyzer = null;
  source = null;
  audioContext = null;
}

export function isAudioRunning() {
  return isRunning;
}
