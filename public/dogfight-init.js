(function() {
  const CANVAS_ID = 'dogfight-canvas';

  function initWebGL() {
    const canvas = document.getElementById(CANVAS_ID);
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      canvas.innerHTML = 'WebGL is not supported in your browser';
      return;
    }

    // Store gl context on canvas for external access
    canvas.__gl = gl;

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set clear color (dark background)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    console.log('WebGL initialized successfully');

    // Dispatch custom event for external code to hook into
    canvas.dispatchEvent(new CustomEvent('webgl-ready', {
      detail: { gl, canvas }
    }));
  }

  // Initialize when DOM is ready or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebGL);
  } else {
    initWebGL();
  }

  // Re-initialize on HTMX swaps
  document.body.addEventListener('htmx:afterSwap', function(e) {
    if (e.detail.target.querySelector('#' + CANVAS_ID) ||
        e.detail.target.id === CANVAS_ID) {
      initWebGL();
    }
  });
})();
