const React = require('react');
const ReactDOM = require('react-dom');

import {compose} from 'recompose';

import withGUI from './gui';
import withStats from './with_stats';

let frames = [];

const numStripes = 240;


const imageWidth = 320 * 4;
const imageHeight = 240 * 4;

const sliceHeight = Math.floor(imageHeight / numStripes);

// const mask = [true, true, true, false, false];

const weave1 = [0, 0, 0, 1];
const weave2 = [2, 3, 2, 2];

function transferPixel(src, dest, x0, y0, x1, y1) {
  const srcIndex = y0 * imageWidth + x0;
  const destIndex = y1 * imageWidth + x1;

  dest[destIndex * 4 + 0] = src[srcIndex * 4 + 0];
  dest[destIndex * 4 + 1] = src[srcIndex * 4 + 1];
  dest[destIndex * 4 + 2] = src[srcIndex * 4 + 2];
  dest[destIndex * 4 + 3] = src[srcIndex * 4 + 3];
}

const drawingMethods = {
  standard(frames, destFrame, x, y) {
    const sourceFrame = frames[Math.floor(y/ sliceHeight)];
    if(!sourceFrame) {
      return;
    }
    transferPixel(sourceFrame, destFrame, x, y, x, y);
  },
  ghost(frames, destFrame, x, y) {
    if(x % 2 === 0) {
      const sourceFrame = frames[Math.floor(y/ sliceHeight)];
      if(!sourceFrame) {
        return;
      }

      transferPixel(sourceFrame, destFrame, x, y, x, y);
    } else {
      transferPixel(frames[0], destFrame, x, y, x, y);
    }

  },
  mirror(frames, destFrame, x, y) {
    const sourceFrame = frames[Math.floor(y/ sliceHeight)];
    if(!sourceFrame) {
      return;
    }

    if (x % 2 === 0) {
      transferPixel(sourceFrame, destFrame, x, y, x, y);
    } else {
      transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, y)
    }
  },
  screen(frames, destFrame, x, y) {
    const sourceFrame = frames[Math.floor(y/ sliceHeight)];
    if(!sourceFrame) {
      return;
    }
    // the source and dest indices are mixed up but it's cool anyway

    const xp = Math.floor(x / this.props.imgScale);
    const yp = Math.floor(y / this.props.imgScale);

    // switching source and dest coordinates makes it chug
    // getting from multiple source locations at the same time is SLOW ??

    const screenIndex = Math.floor(x / this.props.screenScale) % 4;

    if (screenIndex === 0) {
      transferPixel(sourceFrame, destFrame, xp, yp, x, y);
    } else if (screenIndex === 1) {
      transferPixel(sourceFrame, destFrame, xp, yp, imageWidth - x, y);
    } else if (screenIndex === 2) {
      transferPixel(sourceFrame, destFrame, xp, yp, x, imageHeight - y);

    } else {
      transferPixel(sourceFrame, destFrame, xp, yp, imageWidth - x, imageHeight - y);
    }
  },
  dither(frames, destFrame, x, y) {
    const sourceFrame = frames[Math.floor(y/ sliceHeight)];
    if(!sourceFrame) {
      return;
    }

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
  },
  weave(frames, destFrame, x, y) {
    const sourceFrame = frames[Math.floor(y/ sliceHeight)];
    if(!sourceFrame) {
      return;
    }

    const scaledY = Math.floor(y / this.props.screenScale)
    const scaledX = Math.floor(x / this.props.screenScale)

    const choice = (scaledY % 2 === 0 ? weave1 : weave2)[scaledX % 4];

    // switching 1 and 2 is REALLY slow for some reason

    if(choice === 0) {
      transferPixel(sourceFrame, destFrame, x, y, x, y);

    } else if(choice === 2) {
      transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, y);

    } else if(choice === 1) {
      transferPixel(sourceFrame, destFrame, x, y, x, imageHeight - y);

    } else if(choice === 3) {
      transferPixel(sourceFrame, destFrame, x, y, imageWidth - x, imageHeight - y);

    }

  }
};

class App extends React.Component {
  methods = {
    generateFrame: (frames, ctx) => {
      const destFrame = ctx.createImageData(imageWidth, imageHeight);
      const destData = destFrame.data;

      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          this.drawTheThing(frames, destData, x, y)
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
      frames.unshift(frame.data);
      frames = frames.slice(0, this.props.frameDelay * (numStripes + 10));

      requestAnimationFrame(record);
    };

    const draw = () => {
      this.props.beginStats();

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

      this.props.endStats();

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
        <canvas id="main-canvas" ref="canvas" width={imageWidth} height={imageHeight}/>
        <video muted autoPlay playsInline loop controls ref="video" crossOrigin="anonymous"
               src="https://s3.us-east-2.amazonaws.com/atomanyih.github.io/bigbang.MOV"/>
        <audio src="https://s3.us-east-2.amazonaws.com/atomanyih.github.io/Mark+Deutsch+-+Fool+-+Bazantar-Sitar+-+02+The+Painted+Bird.mp3" autoPlay/>
      </div>
    );
  }
}

const EnhancedApp = compose(
  withGUI(
    {
      name: 'drawingMethod',
      initialValue: window.location.hash.slice(1) || 'screen',
      options: [Object.keys(drawingMethods)]
    },
    {name: 'playbackRate', initialValue: 0.3, options: [0, 1, 0.05]},
    {name: 'imgOffset', initialValue: 0, options: [-800, 0, 25]},
    {name: 'pixel', initialValue: true, options: []},
    {name: 'screenScale', initialValue: 3, options: [1, 20, 1]},
    {name: 'imgScale', initialValue: 1, options: [1, 10, 0.01]},
    {name: 'statsOpen', initialValue: false, options: []},
  ),
  withStats
)(App);

ReactDOM.render(<EnhancedApp frameDelay={1}/>, document.getElementById('root'));
