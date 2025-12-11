import type { FC } from "hono/jsx";

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
      <script src="/dogfight-init.js"></script>
    </div>
  );
};
