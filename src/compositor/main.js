import * as THREE from "three";

class Composite {
  bufferCanvas;
  compositeSteps = [];

  constructor(bufferCanvas) {
    this.bufferCanvas = bufferCanvas;
  }

  addStep(step) {
    this.compositeSteps.push(step);
    return this;
  }

  render() {
    let j = this.compositeSteps.length;
    while (j--) {
      this.compositeSteps[j].render(this.bufferCanvas);
    }
  }
}

class DrawCube {
  myCanvas = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    return canvas;
  })();

  scene;
  cube;
  camera;
  renderer;

  constructor() {
    const { scene, cube, camera, renderer } = this.buildScene();
    this.scene = scene;
    this.cube = cube;
    this.camera = camera;
    this.renderer = renderer;
  }

  render(bufferCanvas) {
    this.draw();
    bufferCanvas.getContext("2d").drawImage(this.myCanvas, 0, 0);
  }

  draw() {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
  }

  buildScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas: this.myCanvas,
      alpha: true,
    });
    renderer.setSize(this.myCanvas.width, this.myCanvas.height);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    return { scene, cube, camera, renderer };
  }
}

class DrawHappyFace {
  myCanvas = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    return canvas;
  })();

  render(bufferCanvas) {
    this.draw();

    bufferCanvas.getContext("2d").drawImage(this.myCanvas, 0, 0);
  }

  draw() {
    const ctx = this.myCanvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
    ctx.moveTo(110, 75);
    ctx.arc(75, 75, 35, 0, Math.PI, false); // Mouth (clockwise)
    ctx.moveTo(65, 65);
    ctx.arc(60, 65, 5, 0, Math.PI * 2, true); // Left eye
    ctx.moveTo(95, 65);
    ctx.arc(90, 65, 5, 0, Math.PI * 2, true); // Right eye

    ctx.strokeStyle = "blue";

    ctx.stroke();
    ctx.save();
  }
}

export const compositionState = {
  PAUSE: 0,
  PLAY: 1,
};

export class VideoProcessor {
  // HTMLVideoElement
  videoElement;

  // HTMLCanvasElement
  bufferCanvas;

  // HTMLCanvasElement
  targetCanvas;

  // Current state of video being played
  compositionState = compositionState.PAUSE;

  // Buffer context animation id
  animId;

  // Composition steps
  compositionSteps;

  constructor() {
    this.videoElement = (() => {
      const vid = document.createElement("video");
      vid.width = 640;
      vid.height = 480;
      vid.setAttribute("crossOrigin", "anonymous");
      return vid;
    })();
    this.bufferCanvas = (() => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      return canvas;
    })();
    this.targetCanvas = (() => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      return canvas;
    })();

    this.compositionSteps = new Composite(this.bufferCanvas)
      .addStep(new DrawHappyFace())
      .addStep(new DrawCube());
  }

  async start() {
    if (this.compositionState === compositionState.PLAY) {
      return;
    }
    // Get Target Buffer
    const targetCtx = this.targetCanvas.getContext("2d");
    if (!targetCtx) {
      return Promise.reject(
        "Unable to render video. Failed to get target canvas 2d context"
      );
    }

    // Get Buffer Ctx
    const bufferCtx = this.bufferCanvas.getContext("2d");
    if (!bufferCtx) {
      return Promise.reject(
        "Unable to render video. Failed to get buffer canvas 2d context"
      );
    }

    // Get Video stream from user webcam
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });

    // Attach media stream to video element
    this.videoElement.srcObject = mediaStream;

    // Play video
    await this.videoElement.play();

    // Render Video onto buffer canvas
    this.renderVideo();

    this.compositionState = compositionState.PLAY;
  }

  renderVideo() {
    const buffer2dCtx = this.bufferCanvas.getContext("2d");
    const target2dCtx = this.targetCanvas.getContext("2d");
    const renderVideo = () => {
      this.animId = window.requestAnimationFrame(renderVideo);

      if (this.videoElement.readyState < this.videoElement.HAVE_CURRENT_DATA) {
        return;
      }

      if (
        this.videoElement.videoHeight <= 0 ||
        this.videoElement.videoWidth <= 0
      ) {
        return;
      }
      // Move pixels from video onto buffer canvas
      buffer2dCtx.drawImage(this.videoElement, 0, 0);
      // Manipulate data on buffer canvas

      this.compositionSteps.render();

      this.scaleCanvas();
      // Draw final image onto target canvas
      target2dCtx.drawImage(this.bufferCanvas, 0, 0);
    };

    this.animId = window.requestAnimationFrame(renderVideo);
  }

  scaleCanvas() {
    const scaleX = window.innerWidth / this.targetCanvas.width;
    const scaleY = window.innerHeight / this.targetCanvas.height;

    const scaleToFit = Math.min(scaleX, scaleY);
    // const scaleToCover = Math.max(scaleX, scaleY);

    this.targetCanvas.style.transformOrigin = "0 0"; //scale from top left
    this.targetCanvas.style.transform = `scale(${scaleToFit})`;
  }

  stop() {
    window.cancelAnimationFrame(this.animId);
    this.videoElement.pause();
    this.compositionState = compositionState.PAUSE;
  }
}
