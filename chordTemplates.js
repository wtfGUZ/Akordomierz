const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Helper to create a 12-element array with 1s at specified indices and 0s elsewhere
function createTemplate(indices) {
  const template = new Array(12).fill(0);
  indices.forEach(i => template[i] = 1);
  return template;
}

// Generate templates for 12 Major and 12 Minor chords
const chordTemplates = [];

for (let i = 0; i < 12; i++) {
  // Major: Root (0), Major Third (4), Perfect Fifth (7)
  const majorIndices = [i, (i + 4) % 12, (i + 7) % 12];
  chordTemplates.push({
    name: NOTES[i],
    type: 'Major',
    label: NOTES[i], // e.g., "C"
    template: createTemplate(majorIndices)
  });

  // Minor: Root (0), Minor Third (3), Perfect Fifth (7)
  const minorIndices = [i, (i + 3) % 12, (i + 7) % 12];
  chordTemplates.push({
    name: NOTES[i],
    type: 'Minor',
    label: NOTES[i] + 'm', // e.g., "Cm"
    template: createTemplate(minorIndices)
  });
}

// Calculate Cosine Similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < 12; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Keep track of the last few detected chords for smoothing (simple running mode/median)
const historySize = 5;
const detectionHistory = [];

export function detectChord(chromagram) {
  // Check if there's enough volume/energy (sum of chromagram > threshold)
  const energy = chromagram.reduce((a, b) => a + b, 0);
  if (energy < 0.1) {
    // Return null if silence
    updateHistory(null);
    return getSmoothedChord();
  }

  let bestMatch = null;
  let maxSimilarity = -1;

  for (const chord of chordTemplates) {
    const similarity = cosineSimilarity(chromagram, chord.template);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = chord;
    }
  }

  // Threshold to avoid random noise matching poorly
  if (maxSimilarity > 0.6) {
    updateHistory(bestMatch.label);
  } else {
    updateHistory(null);
  }

  return getSmoothedChord();
}

function updateHistory(chordLabel) {
  detectionHistory.push(chordLabel);
  if (detectionHistory.length > historySize) {
    detectionHistory.shift();
  }
}

function getSmoothedChord() {
  if (detectionHistory.length === 0) return null;
  
  // Count frequencies
  const counts = {};
  let maxCount = 0;
  let mostFrequent = null;

  for (const label of detectionHistory) {
    if (label === null) continue;
    counts[label] = (counts[label] || 0) + 1;
    if (counts[label] > maxCount) {
      maxCount = counts[label];
      mostFrequent = label;
    }
  }

  // If mostly silence, return null
  const nullCount = detectionHistory.filter(x => x === null).length;
  if (nullCount > historySize / 2) {
    return null;
  }

  return mostFrequent;
}
