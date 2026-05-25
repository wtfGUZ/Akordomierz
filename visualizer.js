let canvas, ctx;
let width, height;
let animationId;
let currentChroma = new Array(12).fill(0);
let targetChroma = new Array(12).fill(0);

export function initVisualizer(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  
  // Handle resize
  const resize = () => {
    // Match the canvas rendering resolution to its CSS size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = canvas.width;
    height = canvas.height;
  };
  
  window.addEventListener('resize', resize);
  resize();

  // Start the animation loop
  draw();
}

export function updateVisualizer(features) {
  if (features && features.chroma) {
    // Update target values when new data arrives (approx 10 times a second)
    for (let i = 0; i < 12; i++) {
      targetChroma[i] = features.chroma[i];
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  
  // Draw circular visualizer
  const numBars = 12;
  const angleStep = (Math.PI * 2) / numBars;

  for (let i = 0; i < numBars; i++) {
    // Smoothly interpolate currentChroma towards targetChroma *every frame* (60+ Hz)
    currentChroma[i] += (targetChroma[i] - currentChroma[i]) * 0.15;
    
    const value = currentChroma[i] || 0;
    // Base radius + additional length based on chroma value
    const barLength = 10 + (value * radius * 0.8);
    
    const angle = i * angleStep - Math.PI / 2; // start from top
    
    const startX = centerX + Math.cos(angle) * (radius * 0.5); // Start slightly offset from center
    const startY = centerY + Math.sin(angle) * (radius * 0.5);
    
    const endX = centerX + Math.cos(angle) * (radius * 0.5 + barLength);
    const endY = centerY + Math.sin(angle) * (radius * 0.5 + barLength);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    // Create a gradient for the bar
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)'); // var(--accent-color) faded
    gradient.addColorStop(1, `rgba(167, 139, 250, ${0.4 + value * 0.6})`); // brighter based on intensity

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  animationId = requestAnimationFrame(draw);
}

export function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  // Clear canvas
  if (ctx) {
    ctx.clearRect(0, 0, width, height);
  }
  // Reset chroma
  currentChroma = new Array(12).fill(0);
}
