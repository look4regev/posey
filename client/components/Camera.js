import { drawKeyPoints, drawSkeleton } from "./utils";
import React, { Component } from "react";
import PropTypes from "prop-types";
import posesJson from "../../poses.json";

import "./game.css";

const similarity = require("compute-cosine-similarity");

const threshold = 0.1;
const timeToPlay = 31;
const width = 340;
const height = 560;
let keypointsVector;

class PoseNet extends Component {
  static defaultProps = {
    // videoWidth: 620,
    // videoHeight: 349,
    videoHeight: height,
    videoWidth: width,
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
      timeLeft: timeToPlay,
      showTimer: false,
      similarity: 10000
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

  getCanvas = elem => {
    this.canvas = elem;
  };

  getVideo = elem => {
    this.video = elem;
  };

  async componentDidMount() {
    try {
      await this.setupCamera();
    } catch (error) {
      throw new Error(
        "This browser does not support video capture, or this device does not have a camera"
      );
    }
    keypointsVector = PoseNet.keyPointsToVector(
      posesJson[this.props.image].keypoints
    );
    console.log(this.props.image);
    this.interval = setInterval(() => {
      this.setState({ showTimer: true });
      if (this.state.timeLeft === 1) {
        this.props.sendData(false);
      } else {
        this.setState({ timeLeft: this.state.timeLeft - 1 });
      }
    }, 1000);
    this.detectPose();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.setState({
      timeLeft: timeToPlay,
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
    if (similarity < 0.2) {
      return "Almost there!";
    }
    if (similarity < 0.4) {
      return "You're close!";
    }
    if (similarity < 0.6) {
      return "Improving!";
    }
    return "Not very close";
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
      showVideo,
      showPoints,
      showSkeleton,
      skeletonColor,
      skeletonLineWidth
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
          if (distance < threshold) {
            console.log("Success!!!");
            this.props.sendData(true);
          }
          if (showPoints) {
            drawKeyPoints(
              keypoints,
              minPartConfidence,
              skeletonColor,
              canvasContext
            );
          }
          if (showSkeleton) {
            drawSkeleton(
              keypoints,
              minPartConfidence,
              skeletonColor,
              skeletonLineWidth,
              canvasContext
            );
          }
        }
      });
      requestAnimationFrame(findPoseDetectionFrame);
    };
    findPoseDetectionFrame();
  }

  render() {
    return (
      <div>
        <div>
          {this.state.showTimer && <h2>{this.state.timeLeft}</h2>}
          {this.state.showTimer && (
            <h3>{PoseNet.printScore(this.state.similarity)}</h3>
          )}
          {this.state.showTimer && <h4>{this.state.similarity}</h4>}
          <video id="videoNoShow" playsInline ref={this.getVideo} />
          <canvas className="webcam" ref={this.getCanvas} />
        </div>
      </div>
    );
  }
}

PoseNet.propTypes = {
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
