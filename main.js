import './style.css';
import { startAudioAnalysis, stopAudioAnalysis, isAudioRunning } from './chordRecognizer.js';
import { initVisualizer, updateVisualizer, stopVisualizer } from './visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const statusMessage = document.getElementById('status-message');
  const chordDisplay = document.getElementById('chord-display');
  const canvasElement = document.getElementById('audio-visualizer');

  // Initialize the canvas visualizer
  initVisualizer(canvasElement);

  let currentDisplayedChord = null;

  startBtn.addEventListener('click', async () => {
    if (isAudioRunning()) {
      // Stop listening
      stopAudioAnalysis();
      stopVisualizer();
      
      startBtn.classList.remove('listening');
      startBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        Start Listening
      `;
      statusMessage.textContent = "Listening stopped.";
      
      // Reset Display
      chordDisplay.innerHTML = '<span class="placeholder">--</span>';
      chordDisplay.classList.remove('active');
      currentDisplayedChord = null;

      // Re-init visualizer (cleared)
      initVisualizer(canvasElement);

    } else {
      // Start listening
      statusMessage.textContent = "Requesting microphone access...";
      
      const success = await startAudioAnalysis(
        (detectedChord) => {
          // Callback when a chord is detected/updated
          if (detectedChord) {
            if (currentDisplayedChord !== detectedChord) {
              currentDisplayedChord = detectedChord;
              chordDisplay.textContent = detectedChord;
              
              // Add a pop animation
              chordDisplay.classList.remove('active');
              // Trigger reflow
              void chordDisplay.offsetWidth;
              chordDisplay.classList.add('active');
            }
          } else {
            // Silence or unrecognized
            if (currentDisplayedChord !== null) {
              currentDisplayedChord = null;
              chordDisplay.innerHTML = '<span class="placeholder">--</span>';
              chordDisplay.classList.remove('active');
            }
          }
        },
        (features) => {
          // Callback for visualizer
          updateVisualizer(features);
        }
      );

      if (success) {
        startBtn.classList.add('listening');
        startBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="5" y="5" rx="2" ry="2"/></svg>
          Stop Listening
        `;
        statusMessage.textContent = "Listening to your guitar...";
      } else {
        statusMessage.textContent = "Error: Microphone access denied or not available.";
      }
    }
  });
});
