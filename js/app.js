const React = require('react');
const ReactDOM = require('react-dom');

import Stats from 'stats.js'

import withGUI from './gui';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

let frames = [];

const frameDelay = 1;

const numStripes = 240;


const imageWidth = 320 * 4;
const imageHeight = 240 * 4;

const sliceHeight = Math.floor(imageHeight / numStripes);

function generateFrame(frames, ctx) {
  const destFrame = ctx.createImageData(frames[0]);
  destFrame.data.set(frames[0].data);

  for (let i = 0; i < numStripes; i++) {
    let ySlice = sliceHeight * i;
    let sourceFrame = frames[i * frameDelay];

    if (!sourceFrame) {
      break
    }

    for (let yOffset = 0; yOffset < sliceHeight; yOffset++) {
      for (let x = 0; x < imageWidth; x++) {

        let y = ySlice + yOffset;

        let pixelIndex = y * imageWidth + x; // putting x*2  gets cool interlacing

        destFrame.data[pixelIndex * 4 + 0] = sourceFrame.data[pixelIndex * 4 + 0];
        destFrame.data[pixelIndex * 4 + 1] = sourceFrame.data[pixelIndex * 4 + 1];
        destFrame.data[pixelIndex * 4 + 2] = sourceFrame.data[pixelIndex * 4 + 2];
        destFrame.data[pixelIndex * 4 + 3] = sourceFrame.data[pixelIndex * 4 + 3];
      }
    }
  }

  return destFrame;
}

class App extends React.Component {
  componentDidMount() {
    const {canvas, video} = this.refs;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      stats.begin();
      ctx.drawImage(video, 0, 0, imageWidth, imageHeight);

      const frame = ctx.getImageData(0, 0, imageWidth, imageHeight);
      frames.unshift(frame);

      if(this.props.pixel) {
        const generatedFrame = generateFrame(frames, ctx);
        ctx.putImageData(generatedFrame, 0, 0);
      } else {
        for(let i = 0; i < numStripes; i++) {
          const frame2 = frames[i * frameDelay];

          if(frame2) {
            ctx.putImageData(frame2, 0, 0, 0, sliceHeight * i, imageWidth, sliceHeight + 1);
          }
        }
      }

      frames = frames.slice(0, frameDelay * (numStripes + 10));

      stats.end();

      requestAnimationFrame(draw);
    };

    draw();
  }

  componentDidUpdate() {
    this.refs.video.playbackRate = this.props.playbackRate
  }

  render() {
    return (
      <div className="app">
        <canvas ref="canvas" width={2000} height={1000}/>
        <video muted autoPlay playsInline loop controls ref="video"
               // src="train.mp4"/>
               src="video.MOV"/>
      </div>
    );
  }
}

const EnhancedApp = withGUI(
  {name: 'playbackRate', initialValue: 1, options: [0, 1]},
  {name: 'pixel', initialValue: true, options: []}
)(App);

ReactDOM.render(<EnhancedApp />, document.getElementById('root'));