import React, { Component } from "react";

import "./game.css";
import PropTypes from "prop-types";

const timeToPlay = 3;

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeLeft: timeToPlay,
      image: ""
    };
  }

  static getRandomImage() {
    const index = Math.floor(Math.random() * 20) + 1;
    return index + ".jpg";
  }

  componentDidMount() {
    const image = Game.getRandomImage();
    this.setState({ image: image });
    this.interval = setInterval(() => {
      if (this.state.timeLeft === 1) {
        this.props.sendData(image);
      } else {
        this.setState({ timeLeft: this.state.timeLeft - 1 });
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.setState({
      timeLeft: timeToPlay,
      image: ""
    });
  }

  render() {
    return (
      <div>
        {<h2>{this.state.timeLeft}</h2>}
        {<img id="pose" src={"/poses/" + this.state.image} alt="yoga pose" />}
      </div>
    );
  }
}

Game.propTypes = {
  sendData: PropTypes.func
};

export default Game;
