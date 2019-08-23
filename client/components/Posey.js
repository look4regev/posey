import React, { Component } from "react";

import "./posey.css";
import Game from "./Game";
import * as posenet from "@tensorflow-models/posenet";
import Camera from "./Camera";

class Posey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameStarted: false,
      cameraOn: false,
      success: false,
      image: ""
    };
    this.startGame = this.startGame.bind(this);
    this.switchToCamera = this.switchToCamera.bind(this);
    this.switchToImage = this.switchToImage.bind(this);
  }

  startGame() {
    this.setState({ gameStarted: true });
  }

  async componentDidMount() {
    try {
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
      setTimeout(() => {}, 200);
    }
  }

  switchToCamera(image) {
    this.setState({ image: image, cameraOn: true });
  }

  switchToImage(success) {
    this.setState({ success: success, image: "", cameraOn: false });
  }

  render() {
    return (
      <div>
        <h1>Posey</h1>
        {!this.state.gameStarted && (
          <button onClick={this.startGame}>Start</button>
        )}
        {this.state.gameStarted &&
          !this.state.cameraOn && <Game sendData={this.switchToCamera} />}
        {this.state.gameStarted &&
          this.state.cameraOn && (
            <Camera
              sendData={this.switchToImage}
              image={this.state.image}
              posenet={this.posenet}
            />
          )}
      </div>
    );
  }
}

export default Posey;
