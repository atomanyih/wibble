import React from 'react';
import Stats from 'stats.js';

const withStats = Wrapped => class WithStats extends React.Component {
  methods = {
    beginStats: () => {
      this.stats && this.stats.begin();
    },
    endStats: () => {
      this.stats && this.stats.end();
    }
  };

  componentDidMount() {
    // const stats = new Stats();
    // stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(stats.dom);
    //
    // this.stats = stats;
  }

  render() {
    return <Wrapped {...this.props} beginStats={this.methods.beginStats} endStats={this.methods.endStats}/>
  }
};

export default withStats;