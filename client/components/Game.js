import React, { Component } from "react";

import "./game.css";
import Camera from "./Camera";

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeLeft: 3,
      cameraOn: false,
      image: ""
    };
  }

  static getRandomImage() {
    const index = Math.floor(Math.random() * 20) + 1;
    return index + ".jpg";
  }

  componentDidMount() {
    this.setState({ image: Game.getRandomImage() });
    this.interval = setInterval(() => {
      if (this.state.timeLeft === 1) {
        this.setState({ cameraOn: true });
      } else {
        this.setState({ timeLeft: this.state.timeLeft - 1 });
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.setState({
      timeLeft: 3
    });
  }

  render() {
    return (
      <div>
        {!this.state.cameraOn && <h2>{this.state.timeLeft}</h2>}
        {!this.state.cameraOn && (
          <img src={"/poses/" + this.state.image} alt="yoga pose" />
        )}
        {this.state.cameraOn && <Camera />}
      </div>
    );
  }
}

export default Game;
