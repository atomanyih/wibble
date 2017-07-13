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
    const stats = new Stats();
    stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom

    this.stats = stats;
  }

  componentDidUpdate(prevProps) {
    if(this.props.statsOpen && !prevProps.statsOpen) {
      this.statsDom = document.body.appendChild(this.stats.dom);
    } else if (!this.props.statsOpen && prevProps.statsOpen) {
      document.body.removeChild(this.statsDom)
    }
  }

  render() {
    return <Wrapped {...this.props} beginStats={this.methods.beginStats} endStats={this.methods.endStats}/>
  }
};

export default withStats;