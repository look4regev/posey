import React, { Component } from "react";

import PropTypes from "prop-types";
import * as consts from "./Config";

import "./summary.css";

class Summary extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
  }

  goBack() {
    this.props.sendData();
  }

  render() {
    return (
      <div>
        <h2>
          You got {this.props.score} out of {consts.posePicsCount} correct!
        </h2>
        <div className="buttonContainer">
          <button className="myButton" onClick={this.goBack}>
            Try again
          </button>
        </div>
      </div>
    );
  }
}

Summary.propTypes = {
  sendData: PropTypes.func,
  score: PropTypes.number
};

export default Summary;
