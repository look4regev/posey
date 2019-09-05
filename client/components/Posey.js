import React, { Component } from "react";

import "./posey.css";
import * as posenet from "@tensorflow-models/posenet";
import Camera from "./Camera";
import Feedback from "./Feedback";

class Posey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: "",
      modelLoaded: false,
      activeScreen: "instructions"
    };
    this.startGame = this.startGame.bind(this);
    this.switchToCamera = this.switchToCamera.bind(this);
    this.switchToFeedback = this.switchToFeedback.bind(this);
  }

  startGame() {
    this.setState({ activeScreen: "camera" });
  }

  async componentDidMount() {
    try {
      this.posenet = await posenet.load({
        // slow but best
        architecture: "ResNet50",
        outputStride: 32,
        inputResolution: 161,
        quantBytes: 1

        // fast but worst
        // architecture: "MobileNetV1",
        // outputStride: 16,
        // inputResolution: 161,
        // multiplier: 0.5
      });
      this.setState({ modelLoaded: true });
    } catch (error) {
      throw new Error("PoseNet failed to load");
    } finally {
      setTimeout(() => {}, 200);
    }
  }

  switchToCamera() {
    this.setState({ activeScreen: "camera" });
  }

  switchToFeedback(success) {
    this.setState({ success: success, activeScreen: "feedback" });
  }

  render() {
    const buttonClass = this.state.modelLoaded ? "myButton" : "disabledButton";
    return (
      <div>
        <h1>Posey</h1>
        {this.state.activeScreen === "instructions" && (
          <h3>
            Try to mimic the poses as best you can! <br />
          </h3>
        )}
        {this.state.activeScreen === "instructions" && (
          <div className="buttonContainer">
            <button
              disabled={!this.state.modelLoaded}
              className={buttonClass}
              onClick={this.startGame}
            >
              Start
            </button>
          </div>
        )}
        {this.state.activeScreen === "instructions" &&
          !this.state.modelLoaded && <h4>Model loading, please wait...</h4>}
        {this.state.activeScreen === "feedback" &&
          this.state.success !== "" && (
            <Feedback
              sendData={this.switchToCamera}
              success={this.state.success}
            />
          )}
        {this.state.activeScreen === "camera" && (
          <Camera
            sendData={this.switchToFeedback}
            isActive={this.state.activeScreen === "camera"}
            posenet={this.posenet}
          />
        )}
      </div>
    );
  }
}

export default Posey;
