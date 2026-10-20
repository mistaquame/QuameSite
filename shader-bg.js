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

  // Black base + vignette. No colored gradients — just subtle edge darkening
  // to give depth without competing with foreground content.
  const shader = await createShader(canvas, {
    components: [
      {
        type: 'SolidColor',
        id: 'black',
        props: { color: '#000000' },
      },
      {
        type: 'Vignette',
        id: 'vignette',
        props: {
          color: '#000000',
          intensity: 0.5,
          radius: 0.7,
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
