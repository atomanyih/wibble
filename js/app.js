const React = require('react');
const ReactDOM = require('react-dom');

import Stats from 'stats.js'

import withGUI from './gui';

const stats = new Stats();
stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

let frames = [];

const numStripes = 240;


const imageWidth = 320 * 4;
const imageHeight = 240 * 4;

const sliceHeight = Math.floor(imageHeight / numStripes);

// const mask = [true, true, true, false, false];

function transferPixel(src, dest, x0, y0, x1, y1) {
  const srcIndex = y0 * imageWidth + x0;
  const destIndex = y1 * imageWidth + x1;

  dest.data[destIndex * 4 + 0] = src.data[srcIndex * 4 + 0];
  dest.data[destIndex * 4 + 1] = src.data[srcIndex * 4 + 1];
  dest.data[destIndex * 4 + 2] = src.data[srcIndex * 4 + 2];
  dest.data[destIndex * 4 + 3] = src.data[srcIndex * 4 + 3];
}

const drawingMethods = {
  mirror(sourceFrame, destFrame, x, y) {
    if (x % 2 === 0) {
      transferPixel(sourceFrame, destFrame, x, y, x, y);
    } else {
      transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, y)
    }
  },
  screen(sourceFrame, destFrame, x, y) {
    if (x % 4 === 0) {
      transferPixel(sourceFrame, destFrame, x, y, x, y);
    } else if (x % 4 === 1) {
      transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, y)

    } else if (x % 4 === 2) {
      transferPixel(sourceFrame, destFrame, x, y, x, imageHeight - y);

    } else {
      transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, imageHeight - y);
    }
  },
  dither(sourceFrame, destFrame, x, y) {
    if (y % 2 === 0) {
      if (x % 2 === 0) {
        transferPixel(sourceFrame, destFrame, x, y, x, y);
      } else {
        transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, y)
      }
    } else {
      if (x % 2 === 0) {
        transferPixel(sourceFrame, destFrame, x, y, x, imageHeight - y);
      } else {
        transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, imageHeight - y);
      }
    }
  }
};

class App extends React.Component {
  methods = {
    generateFrame: (frames, ctx) => {
      const destFrame = ctx.createImageData(frames[0]);
      // destFrame.data.set(frames[0].data);

      for (let i = 0; i < numStripes; i++) {
        let ySlice = sliceHeight * i;
        let sourceFrame = frames[i * this.props.frameDelay];

        if (!sourceFrame) {
          break
        }

        for (let yOffset = 0; yOffset < sliceHeight; yOffset++) {
          let y = ySlice + yOffset;

          if (y >= destFrame.data.height) {
            continue;
          }
          for (let x = 0; x < imageWidth; x++) {
            this.drawTheThing(sourceFrame, destFrame, x, y)
          }
        }
      }

      return destFrame;
    }
  };

  componentDidMount() {
    this.drawTheThing = drawingMethods[this.props.drawingMethod];

    // navigator.getUserMedia({video: true, audio: true}, function(localMediaStream) {
    //   var video = document.querySelector('video');
    //   video.src = window.URL.createObjectURL(localMediaStream);
    // }, () => {});

    this.refs.video.playbackRate = this.props.playbackRate

    const {canvas, video} = this.refs;
    const ctx = canvas.getContext('2d');

    const ctx2 = this.refs.intermediateCanvas.getContext('2d')

    const record = () => {
      ctx2.drawImage(video, 0, 0, imageWidth, imageHeight);

      const frame = ctx2.getImageData(0, 0, imageWidth, imageHeight);
      frames.unshift(frame);
      frames = frames.slice(0, this.props.frameDelay * (numStripes + 10));

      requestAnimationFrame(record);
    };

    const draw = () => {
      stats.begin();

      if (this.props.pixel) {
        const generatedFrame = this.methods.generateFrame(frames, ctx);
        ctx.putImageData(generatedFrame, 0, 0);
      } else {
        for (let i = 0; i < numStripes; i++) {
          const frame2 = frames[i * this.props.frameDelay];

          if (frame2) {
            ctx.putImageData(frame2, 0, 0, 0, sliceHeight * i, imageWidth, sliceHeight + 1);
          }
        }
      }

      stats.end();

      requestAnimationFrame(draw);
    };

    record();
    draw();
  }

  componentDidUpdate() {
    this.refs.video.playbackRate = this.props.playbackRate;
    this.drawTheThing = drawingMethods[this.props.drawingMethod];
  }

  render() {
    return (
      <div className="app">
        <canvas style={{display: 'none'}} ref="intermediateCanvas" width={imageWidth} height={imageHeight}/>
        <canvas ref="canvas" width={imageWidth} height={imageHeight}/>
        <video muted autoPlay playsInline loop controls ref="video" crossOrigin="anonymous"
               src="https://s3.us-east-2.amazonaws.com/atomanyih.github.io/bigbang.MOV"/>
      </div>
    );
  }
}

const EnhancedApp = withGUI(
  {name: 'playbackRate', initialValue: 0.3, options: [0, 1, 0.05]},
  {name: 'drawingMethod', initialValue: 'mirror', options: [['mirror', 'screen', 'dither']]},
  {name: 'imgOffset', initialValue: 0, options: [-800, 0, 25]},
  {name: 'pixel', initialValue: true, options: []}
)(App);

ReactDOM.render(<EnhancedApp frameDelay={1}/>, document.getElementById('root'));
