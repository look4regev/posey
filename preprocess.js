import * as posenet from "@tensorflow-models/posenet";
const path = require("path");
const fs = require("fs");
const { Image, createCanvas } = require("canvas");

const width = 340;
const height = 560;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
const posePicsCount = 9;

let imagesProcessed = 0;
let poses = {};

console.log("Loading posenet model. Please wait a minute or less..");

posenet
  .load({
    architecture: "ResNet50",
    outputStride: 16,
    inputResolution: 801,
    quantBytes: 4
  })
  .then(function(net) {
    console.log("posenet model loaded");
    const directoryPath = path.join(__dirname, "public/poses");
    fs.readdir(directoryPath, function(err, files) {
      if (err) {
        return console.log("Unable to scan directory: " + err);
      }
      files.forEach(function(file) {
        const img = new Image();
        img.onload = () => {
          console.log("image loaded");
          ctx.drawImage(img, 0, 0, width, height);
          net
            .estimateSinglePose(canvas, {
              flipHorizontal: true
            })
            .then(pose => {
              poses[file] = pose;
              imagesProcessed++;
              if (imagesProcessed === posePicsCount) {
                let data = JSON.stringify(poses);
                console.log(data);
                fs.writeFileSync("poses.json", data);
                process.exit();
              }
            })
            .catch(err => {
              console.log("error", err);
            });
        };
        img.onerror = err => {
          throw err;
        };
        img.src = directoryPath + "/" + file;
      });
    });
  });
