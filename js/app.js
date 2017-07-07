const React = require('react');
const ReactDOM = require('react-dom');

//n frames behind
// render last frame in n
//each time, if frame.length > n, splice to just n

let frames = [];

const frameDelay = 1;

const numStripes = 300;


const imageWidth = 320 * 4;
const imageHeight = 240 * 4;

const sliceHeight = imageWidth/numStripes;


class App extends React.Component {
  componentDidMount() {
    const {canvas, video} = this.refs;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      requestAnimationFrame(draw);

      ctx.drawImage(video, 0, 0, imageWidth, imageHeight);

      const frame = ctx.getImageData(0, 0, imageWidth, imageHeight);
      frames.unshift(frame);

      for(let i = 0; i < numStripes; i++) {
        const frame2 = frames[i * frameDelay];

        if(frame2) {
          ctx.putImageData(frame2, 0, 0, 0, sliceHeight * i, imageWidth, sliceHeight + 1);
        }
      }

      frames = frames.slice(0, frameDelay*numStripes)


      // if (frames.length > numFrames) {
      //   frames = frames.splice(0, numFrames)
      // }
    };

    draw()
  }

  render() {
    return (
      <div className="app">
        <canvas ref="canvas" width={2000} height={1000}/>
        <video muted autoPlay playsInline controls ref="video"
               src="garden.mp4"/>
      </div>
    );
  }
}


ReactDOM.render(<App />, document.getElementById('root'));