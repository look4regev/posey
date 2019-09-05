import React, { Component } from "react";

import "./posey.css";
import Game from "./Game";
import * as posenet from "@tensorflow-models/posenet";
import Camera from "./Camera";
import Feedback from "./Feedback";

class Posey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: "",
      image: "",
      activeScreen: "instructions"
    };
    this.startGame = this.startGame.bind(this);
    this.switchToCamera = this.switchToCamera.bind(this);
    this.switchToImage = this.switchToImage.bind(this);
    this.switchToFeedback = this.switchToFeedback.bind(this);
  }

  startGame() {
    this.setState({ activeScreen: "image" });
  }

  async componentDidMount() {
    try {
      this.posenet = await posenet.load({
        // slow but best
        // architecture: 'ResNet50',
        // outputStride: 16,
        // inputResolution: 801,
        // quantBytes: 4

        // fast but worst
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
    this.setState({ image: image, activeScreen: "camera" });
  }

  switchToImage() {
    this.setState({ activeScreen: "image" });
  }

  switchToFeedback(success) {
    this.setState({ success: success, activeScreen: "feedback" });
  }

  render() {
    return (
      <div>
        <h1>Posey</h1>
        {this.state.activeScreen === "instructions" && (
          <p>
            Try to mimic the poses as best you can! <br />
            You will have 10 seconds to memorize the pose and 30 seconds to
            mimic it!
          </p>
        )}
        {this.state.activeScreen === "instructions" && (
          <div className="buttonContainer">
            <button className="myButton" onClick={this.startGame}>
              Start
            </button>
          </div>
        )}
        {this.state.activeScreen === "image" && (
          <Game sendData={this.switchToCamera} />
        )}
        {this.state.activeScreen === "feedback" &&
          this.state.success !== "" && (
            <Feedback
              sendData={this.switchToImage}
              success={this.state.success}
            />
          )}
        {this.state.activeScreen === "camera" && (
          <Camera
            sendData={this.switchToFeedback}
            isActive={this.state.activeScreen === "camera"}
            image={this.state.image}
            posenet={this.posenet}
          />
        )}
      </div>
    );
  }
}

export default Posey;
