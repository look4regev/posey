import React, { Component } from "react";

import PropTypes from "prop-types";
import * as consts from "./Config";

import "./summary.css";

const timeToPlay = 5;

class Summary extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    setTimeout(
      function() {
        this.props.sendData();
      }.bind(this),
      1000 * timeToPlay
    );
  }

  render() {
    return (
      <div>
        <h2>
          You got {this.props.score} out of {consts.posePicsCount} correct!
        </h2>
      </div>
    );
  }
}

Summary.propTypes = {
  sendData: PropTypes.func,
  score: PropTypes.number
};

export default Summary;
