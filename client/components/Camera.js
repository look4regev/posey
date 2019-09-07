import React, { Component } from "react";
import PropTypes from "prop-types";
import posesJson from "../../poses.json";
import * as consts from "./Config";

import "./camera.css";

const similarity = require("compute-cosine-similarity");

let keypointsVector;
let imagesSeen = 0;

// const thresholds = {
//   "1.jpg": 0.34,
//   "2.jpg": 0.32,
//   "3.jpg": 0.46,
//   "4.jpg": 0.5,
//   "5.jpg": 0.36
// };

const thresholds = {
  "1.jpg": 0.1,
  "2.jpg": 0.1,
  "3.jpg": 0.1,
  "4.jpg": 0.1,
  "5.jpg": 0.1
};

class PoseNet extends Component {
  static defaultProps = {
    videoHeight: consts.height,
    videoWidth: consts.width,
    flipHorizontal: true,
    algorithm: "single-pose",
    showVideo: true,
    showSkeleton: false,
    showPoints: false,
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
    maxPoseDetections: 2,
    nmsRadius: 20,
    outputStride: 16,
    imageScaleFactor: 0.5,
    skeletonColor: "#ffadea",
    skeletonLineWidth: 6
  };

  constructor(props) {
    super(props, PoseNet.defaultProps);
    this.state = {
      timeLeft: consts.timeToPlay,
      showTimer: false,
      isActive: this.props.isActive,
      similarity: 10000,
      image: "",
      score: this.props.score
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
    const index = ++imagesSeen;
    if (index > consts.posePicsCount) {
      this.setState({ isActive: false });
      this.props.sendData("finish");
    } else {
      return index + ".jpg";
    }
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
        this.props.sendData("false");
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
    const { videoWidth, videoHeight } = this.props;
    const video = this.video;
    video.width = videoWidth;
    video.height = videoHeight;
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: videoWidth,
        height: videoHeight
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
    const { videoWidth, videoHeight } = this.props;
    const canvas = this.canvas;
    const canvasContext = canvas.getContext("2d");
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    this.poseDetectionFrame(canvasContext);
  }

  static printScore(similarity) {
    if (similarity < 0.4) {
      return "4.png";
    }
    if (similarity < 0.45) {
      return "3.png";
    }
    if (similarity < 0.55) {
      return "2.png";
    }
    return "1.png";
  }

  poseDetectionFrame(canvasContext) {
    const {
      algorithm,
      imageScaleFactor,
      flipHorizontal,
      outputStride,
      minPoseConfidence,
      minPartConfidence,
      maxPoseDetections,
      nmsRadius,
      videoWidth,
      videoHeight,
      showVideo
    } = this.props;
    const posenetModel = this.props.posenet;
    const video = this.video;
    const findPoseDetectionFrame = async () => {
      let poses = [];
      switch (algorithm) {
        case "multi-pose": {
          poses = await posenetModel.estimateMultiplePoses(
            video,
            imageScaleFactor,
            flipHorizontal,
            outputStride,
            maxPoseDetections,
            minPartConfidence,
            nmsRadius
          );
          break;
        }
        case "single-pose": {
          const pose = await posenetModel.estimateSinglePose(
            video,
            imageScaleFactor,
            flipHorizontal,
            outputStride
          );
          poses.push(pose);
          break;
        }
      }
      canvasContext.clearRect(0, 0, videoWidth, videoHeight);
      if (showVideo) {
        canvasContext.save();
        canvasContext.scale(-1, 1);
        canvasContext.translate(-videoWidth, 0);
        canvasContext.drawImage(video, 0, 0, videoWidth, videoHeight);
        canvasContext.restore();
      }
      poses.forEach(({ score, keypoints }) => {
        if (score >= minPoseConfidence) {
          const cameraKeyPointsVector = PoseNet.keyPointsToVector(keypoints);
          const distance = PoseNet.cosineDistanceMatching(
            cameraKeyPointsVector,
            keypointsVector
          );
          this.setState({ similarity: distance });
          if (distance < thresholds[this.state.image] && this.state.isActive) {
            this.setState({ isActive: false });
            this.props.sendData("true");
          }
        }
      });
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
          width="10"
          height="10"
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
          {this.state.showTimer && <h2>{this.state.similarity}</h2>}
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
  posenet: PropTypes.any,
  algorithm: PropTypes.string,
  imageScaleFactor: PropTypes.number,
  flipHorizontal: PropTypes.bool,
  outputStride: PropTypes.number,
  minPoseConfidence: PropTypes.number,
  minPartConfidence: PropTypes.number,
  maxPoseDetections: PropTypes.number,
  nmsRadius: PropTypes.number,
  videoWidth: PropTypes.number,
  videoHeight: PropTypes.number,
  showVideo: PropTypes.bool,
  showPoints: PropTypes.bool,
  showSkeleton: PropTypes.bool,
  skeletonColor: PropTypes.string,
  skeletonLineWidth: PropTypes.number
};

export default PoseNet;
