import React, { Component } from "react";

import "./posey.css";
import Game from "./Game";
import * as posenet from "@tensorflow-models/posenet";

class Posey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameStarted: false
    };
    this.startGame = this.startGame.bind(this);
  }

  startGame() {
    this.setState({ gameStarted: true });
  }

  async componentDidMount() {
    try {
      // this.posenet = await posenet.load();
      this.posenet = await posenet.load({
        // architecture: 'ResNet50',
        // outputStride: 16,
        // inputResolution: 801,
        // quantBytes: 4
        architecture: "MobileNetV1",
        outputStride: 16,
        inputResolution: 161,
        multiplier: 0.5
      });
    } catch (error) {
      throw new Error("PoseNet failed to load");
    } finally {
      setTimeout(() => {
        this.setState({ loading: false });
      }, 200);
    }
  }

  render() {
    return (
      <div>
        <h1>Posey</h1>
        {!this.state.gameStarted && (
          <button onClick={this.startGame}>Start</button>
        )}
        {this.state.gameStarted && <Game posenet={this.posenet} />}
      </div>
    );
  }
}

export default Posey;
