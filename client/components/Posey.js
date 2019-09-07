import React, { Component } from "react";

import "./posey.css";
import * as posenet from "@tensorflow-models/posenet";
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
      score: 0
    };
    this.startGame = this.startGame.bind(this);
    this.switchToCamera = this.switchToCamera.bind(this);
    this.switchToFeedback = this.switchToFeedback.bind(this);
    this.switchToInstructions = this.switchToInstructions.bind(this);
  }

  startGame() {
    this.setState({ activeScreen: "camera" });
  }

  async componentDidMount() {
    try {
      this.posenet = await posenet.load({
        architecture: "ResNet50",
        outputStride: 32,
        inputResolution: 193,
        quantBytes: 2
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

  switchToInstructions() {
    this.setState({ activeScreen: "instructions", score: 0 });
  }

  switchToFeedback(success) {
    if (success === "finish") {
      this.setState({
        activeScreen: "summary"
      });
    } else {
      this.setState({
        success: success === "true",
        activeScreen: "feedback",
        score: success === "true" ? this.state.score + 1 : this.state.score
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
            score={this.state.score}
          />
        )}
        {this.state.activeScreen === "summary" && (
          <Summary
            sendData={this.switchToInstructions}
            score={this.state.score}
          />
        )}
      </div>
    );
  }
}

export default Posey;
