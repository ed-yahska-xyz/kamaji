export {};

const CANVAS_ID = "dogfight-canvas";

interface WebGLReadyEventDetail {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
}

declare global {
  interface HTMLCanvasElement {
    __gl?: WebGLRenderingContext;
  }
  interface HTMLElementEventMap {
    "webgl-ready": CustomEvent<WebGLReadyEventDetail>;
  }
}

function initWebGL(): void {
  const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL not supported");
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

  console.log("WebGL initialized successfully");

  // Dispatch custom event for external code to hook into
  canvas.dispatchEvent(
    new CustomEvent("webgl-ready", {
      detail: { gl, canvas },
    })
  );
}

// Initialize when DOM is ready or immediately if already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWebGL);
} else {
  initWebGL();
}

// Re-initialize on HTMX swaps
document.body.addEventListener("htmx:afterSwap", (e: Event) => {
  const detail = (e as CustomEvent).detail;
  const target = detail?.target as HTMLElement | undefined;
  if (
    target?.querySelector?.("#" + CANVAS_ID) ||
    target?.id === CANVAS_ID
  ) {
    initWebGL();
  }
});
