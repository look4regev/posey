import React, { Component } from "react";
import PropTypes from "prop-types";
import posesJson from "../../poses.json";
import * as consts from "./Config";

import "./camera.css";

const similarity = require("compute-cosine-similarity");

let keypointsVector;
let frameCounter = 0;

const thresholds = {
  "1.jpg": 0.25,
  "2.jpg": 0.25,
  "3.jpg": 0.25,
  "4.jpg": 0.35,
  "5.jpg": 0.25
};

class PoseNet extends Component {
  constructor(props) {
    super(props, PoseNet.defaultProps);
    this.state = {
      timeLeft: consts.timeToPlay,
      showTimer: false,
      isActive: this.props.isActive,
      similarity: 10000,
      image: "",
      score: this.props.score,
      imagesSeen: this.props.imagesSeen
    };
  }

  static keyPointsToVector(keypoints) {
    let vector = [];
    for (const [, value] of Object.entries(keypoints)) {
      vector.push(value.position.x);
      vector.push(value.position.y);
    }
    return vector;
  }

  static cosineDistanceMatching(poseVector1, poseVector2) {
    let cosineSimilarity = similarity(poseVector1, poseVector2);
    let distance = 2 * (1 - cosineSimilarity);
    return Math.sqrt(distance);
  }

  getNextImage() {
    let imagesSeen = this.state.imagesSeen;
    let index;
    if (imagesSeen.length >= consts.posePicsCount) {
      this.setState({ isActive: false, imagesSeen: [] });
      index = 1;
      this.props.sendData(null, imagesSeen);
    } else {
      do {
        index = Math.floor(Math.random() * consts.posePicsCount) + 1;
      } while (imagesSeen.includes(index));
      imagesSeen.push(index);
      this.setState({ imagesSeen: imagesSeen });
    }
    return index + ".jpg";
  }

  getCanvas = elem => {
    this.canvas = elem;
  };

  getVideo = elem => {
    this.video = elem;
  };

  async componentDidMount() {
    this.setState({ image: this.getNextImage() });
    try {
      await this.setupCamera();
    } catch (error) {
      throw new Error(
        "This browser does not support video capture, or this device does not have a camera"
      );
    }
    keypointsVector = PoseNet.keyPointsToVector(
      posesJson[this.state.image].keypoints
    );
    this.interval = setInterval(() => {
      this.setState({ showTimer: true });
      if (this.state.timeLeft === 1) {
        this.setState({ isActive: false });
        this.props.sendData(false, this.state.imagesSeen);
      } else {
        this.setState({ timeLeft: this.state.timeLeft - 1 });
      }
    }, 1000);
    this.detectPose();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.setState({
      timeLeft: consts.timeToPlay,
      similarity: 10000
    });
  }

  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }
    const video = this.video;
    video.width = consts.width;
    video.height = consts.height;
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: consts.width,
        height: consts.height
      }
    });
    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(video);
      };
    });
  }

  detectPose() {
    const canvas = this.canvas;
    const canvasContext = canvas.getContext("2d");
    canvas.width = consts.width;
    canvas.height = consts.height;
    this.poseDetectionFrame(canvasContext);
  }

  static printScore(similarity) {
    if (similarity < 0.3) {
      return "4.png";
    }
    if (similarity < 0.35) {
      return "3.png";
    }
    if (similarity < 0.45) {
      return "2.png";
    }
    return "1.png";
  }

  poseDetectionFrame(canvasContext) {
    const posenetModel = this.props.posenet;
    const video = this.video;
    const findPoseDetectionFrame = async () => {
      frameCounter++;
      canvasContext.clearRect(0, 0, consts.width, consts.height);
      canvasContext.save();
      canvasContext.scale(-1, 1);
      canvasContext.translate(-consts.width, 0);
      canvasContext.drawImage(video, 0, 0, consts.width, consts.height);
      canvasContext.restore();
      if (frameCounter % consts.frequency === 0) {
        frameCounter = 0;
        const pose = await posenetModel.estimateSinglePose(video, {
          flipHorizontal: true
        });
        const cameraKeyPointsVector = PoseNet.keyPointsToVector(pose.keypoints);
        const distance = PoseNet.cosineDistanceMatching(
          cameraKeyPointsVector,
          keypointsVector
        );
        this.setState({ similarity: distance });
        if (distance < thresholds[this.state.image] && this.state.isActive) {
          this.setState({ isActive: false });
          this.props.sendData(true, this.state.imagesSeen);
        }
      }
      requestAnimationFrame(findPoseDetectionFrame);
    };
    findPoseDetectionFrame();
  }

  render() {
    const items = [];
    for (let i = 0; i < this.state.score; i++) {
      items.push(
        <img
          className="imgcenter"
          width="30"
          height="30"
          src={"/star.png"}
          alt="star"
        />
      );
    }
    return (
      <div>
        <div className="textcenter">
          {this.state.showTimer && (
            <img
              className="imgcenter"
              id="score"
              width="50"
              height="50"
              src={"/emojis/" + PoseNet.printScore(this.state.similarity)}
              alt="smiley"
            />
          )}
          {this.state.showTimer && <p>{this.state.timeLeft}</p>}
          {this.state.showTimer && items}
        </div>
        <div className="textcenter">
          {this.state.showTimer && (
            <h2>
              {this.state.similarity} {this.state.image}
            </h2>
          )}
          <video id="videoNoShow" playsInline ref={this.getVideo} />
          <canvas className="webcam imgcenter" ref={this.getCanvas} />
          <img
            className="imgcenter"
            id="pose"
            width="600"
            height="720"
            src={"/poses/" + this.state.image}
            alt="yoga pose"
          />
        </div>
      </div>
    );
  }
}

PoseNet.propTypes = {
  isActive: PropTypes.bool,
  score: PropTypes.number,
  sendData: PropTypes.func,
  image: PropTypes.string,
  imagesSeen: PropTypes.arrayOf(PropTypes.number),
  posenet: PropTypes.any
};

export default PoseNet;
