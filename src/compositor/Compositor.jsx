import { useEffect, useMemo, useRef } from "react";
import { VideoProcessor } from "./main";

// Absolutely no rerendering
// Can only render once.
export function Compositor() {
  const compositor = useMemo(() => new VideoProcessor(), []);
  const videoSourceContainer = useRef(null);
  const bufferContainer = useRef(null);
  const happyFaceContainer = useRef(null);
  const cubeContainer = useRef(null);
  const targetContainer = useRef(null);

  useEffect(() => {
    compositor.start().then(() => {
      videoSourceContainer.current.appendChild(compositor.videoElement);
      bufferContainer.current.appendChild(compositor.bufferCanvas);
      happyFaceContainer.current.appendChild(
        compositor.compositionSteps.compositeSteps[0].myCanvas
      );
      cubeContainer.current.appendChild(
        compositor.compositionSteps.compositeSteps[1].myCanvas
      );
      targetContainer.current.appendChild(compositor.targetCanvas);
    });

    return () => {
      compositor.stop();
    };
  }, [compositor]);

  console.log("render");
  return (
    <div>
      <div>
        <h1>Source Video (HTMLVideoElement)</h1>
        <div ref={videoSourceContainer}></div>
      </div>

      <div style={{ display: "flex" }}>
        <div>
          <h1>Happy Face Canvas (HTMLCanvasElement)</h1>
          <div ref={happyFaceContainer}></div>
        </div>
        <div>
          <h1>3D Cube Canvas (HTMLCanvasElement)</h1>
          <div ref={cubeContainer}></div>
        </div>
        <div>
          <h1>Buffer Canvas (HTMLCanvasElement)</h1>
          <div ref={bufferContainer}></div>
        </div>
      </div>
      <div>
        <h1>Target Canvas (HTMLCanvasElement scaled with CSS)</h1>
        <div ref={targetContainer}></div>
      </div>
    </div>
  );
}
