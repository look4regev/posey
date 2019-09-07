import React, { Component } from "react";

import "./posey.css";
import * as posenet from "@tensorflow-models/posenet";
import * as consts from "./Config";
import Camera from "./Camera";
import Feedback from "./Feedback";
import Summary from "./Summary";

class Posey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: "",
      modelLoaded: false,
      activeScreen: "instructions",
      score: 0,
      imagesSeen: []
    };
    this.startGame = this.startGame.bind(this);
    this.switchToCamera = this.switchToCamera.bind(this);
    this.switchToFeedback = this.switchToFeedback.bind(this);
    this.switchToCameraRestart = this.switchToCameraRestart.bind(this);
  }

  async componentDidMount() {
    try {
      this.posenet = await posenet.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        inputResolution: 513,
        multiplier: 0.75,
        quantBytes: 2
      });
      this.setState({ modelLoaded: true });
    } catch (error) {
      throw new Error("PoseNet failed to load");
    } finally {
      setTimeout(() => {}, 200);
    }
  }

  startGame() {
    this.setState({ activeScreen: "camera" });
  }

  switchToCamera() {
    this.setState({ activeScreen: "camera" });
  }

  switchToCameraRestart() {
    this.setState({ activeScreen: "camera", score: 0, imagesSeen: [] });
  }

  switchToFeedback(success, imagesSeen) {
    if (imagesSeen.length === consts.posePicsCount) {
      this.setState({
        activeScreen: "summary"
      });
    } else {
      this.setState({
        success: success,
        activeScreen: "feedback",
        score: success ? this.state.score + 1 : this.state.score,
        imagesSeen: imagesSeen
      });
    }
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
            imagesSeen={this.state.imagesSeen}
            score={this.state.score}
          />
        )}
        {this.state.activeScreen === "summary" && (
          <Summary
            sendData={this.switchToCameraRestart}
            score={this.state.score}
          />
        )}
      </div>
    );
  }
}

export default Posey;
