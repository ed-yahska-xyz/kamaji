import type { FC } from "hono/jsx";
import { html } from "hono/html";

const DogfightScript = () => html`
  <script type="module">
    import "/js/dogfight-init.js";
  </script>
`;

export const Dogfight: FC<{ width?: number; height?: number }> = ({
  width = 800,
  height = 600
}) => {
  return (
    <div class="dogfight-container">
      <canvas
        id="dogfight-canvas"
        width={width}
        height={height}
        style="display: block; background: #1a1a1a;"
      >
        Your browser does not support the canvas element.
      </canvas>
      <DogfightScript />
    </div>
  );
};
