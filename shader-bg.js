/* ============================================
   QuameVoice Landing Page — Shader Background
   Uses shaders.com WebGPU components (vanilla JS)
   Falls back to CSS ambient orbs if WebGPU is unavailable.
   ============================================ */

(async function initShaderBackground() {
  'use strict';

  const canvas = document.getElementById('shader-bg');
  const cssFallback = document.getElementById('css-fallback-orbs');
  if (!canvas) return;

  // Check WebGPU support before importing the heavy bundle
  if (!navigator.gpu) {
    canvas.style.display = 'none';
    if (cssFallback) cssFallback.style.display = '';
    return;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No adapter');
  } catch {
    canvas.style.display = 'none';
    if (cssFallback) cssFallback.style.display = '';
    return;
  }

  // Hide CSS fallback — shader will take over
  if (cssFallback) cssFallback.style.display = 'none';

  // Dynamic import so browsers without WebGPU never download the bundle
  const { createShader } = await import('https://esm.sh/shaders@4.0.4/js');

  // One soft ember glow anchored at the top-center, fading to pure black.
  // RadialGradient with a tight bounding box so it reads as ambient light,
  // not a shape. Everything below stays black — text sits on darkness.
  const shader = await createShader(canvas, {
    components: [
      {
        type: 'RadialGradient',
        id: 'ember',
        props: {
          colorA: '#3d1a00',
          colorB: '#000000',
          center: { x: 0.5, y: -0.15 },
          colorSpace: 'oklab',
          // Confine the glow to the upper third of the viewport
          boundingBox: {
            x: { unit: 'uv', value: 0 },
            y: { unit: 'uv', value: 0 },
            width: { unit: 'uv', value: 1 },
            height: { unit: 'uv', value: 0.7 },
            origin: 'top-left',
          },
        },
      },
    ],
  });

  // Pause rendering when the tab is hidden to save GPU cycles
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      shader.pause();
    } else {
      shader.resume();
    }
  });
})();
