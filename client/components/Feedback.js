import React, { Component } from "react";

import PropTypes from "prop-types";

import "./feedback.css";

const timeToPlay = 3;

class Feedback extends Component {
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

  static getEmoji(success) {
    if (success) {
      return "5.png";
    }
    return "1.png";
  }

  render() {
    return (
      <div>
        <img
          className="center"
          id="score"
          width="200"
          height="200"
          src={"/emojis/" + Feedback.getEmoji(this.props.success)}
          alt="smiley"
        />
      </div>
    );
  }
}

Feedback.propTypes = {
  sendData: PropTypes.func,
  success: PropTypes.bool
};

export default Feedback;
