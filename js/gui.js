import dat from 'dat.gui/build/dat.gui'
import React from "react";

const withGUI = (...controls) => Wrapped =>
  class GUI extends React.Component {
    state = controls.reduce((acc, control) => {
      acc[control.name] = control.initialValue
      return acc;
    }, {});

    componentDidMount() {
      this.gui = new dat.GUI();

      controls.forEach((control) => {
        this.gui.add(this.state, control.name, ...control.options).onChange((value) => {
          this.setState({
            [control.name]: value
          });
        })
      })

    }

    render() {
      return (
        <Wrapped {...this.state} {...this.props}/>
      )
    }
  };

export default withGUI;