import React, { useRef, useEffect, useState } from "react";
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities";


function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [counter, setCounter] = useState(0);
  const [stage, setStage] = useState("down");
  const [hasCounted, setHasCounted] = useState(false); // Flag to track counting

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  const detectPose = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      const pose = await net.estimateSinglePose(video);
      drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);

      if (pose.keypoints.length) {
        // Use correct keypoints
        const shoulder = [pose.keypoints[6].position.x, pose.keypoints[6].position.y]; // Right Shoulder
        const elbow = [pose.keypoints[8].position.x, pose.keypoints[8].position.y]; // Right Elbow
        const wrist = [pose.keypoints[10].position.x, pose.keypoints[10].position.y]; // Right Wrist

        // Calculate angle
        const angle = calculateAngle(shoulder, elbow, wrist);
        console.log(`Shoulder: ${shoulder}, Elbow: ${elbow}, Wrist: ${wrist}, Angle: ${angle}`);

        // Determine stage
        if (angle > 100) {
          setStage("down");
          setHasCounted(false); // Reset flag when going down
        } else if (angle < 60 && stage === 'down' && !hasCounted) {
          setStage("up");
          setCounter(prevCounter => prevCounter + 1);
          setHasCounted(true); // Set flag to true after counting
        }
      }
    }
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose.keypoints, 0.6, ctx);
    drawSkeleton(pose.keypoints, 0.7, ctx);
  };

  useEffect(() => {
    const runPosenet = async () => {
      const net = await posenet.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.8,
      });

      setInterval(() => {
        detectPose(net);
      }, 100);
    };

    runPosenet();
  }, [stage]);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 10,
            width: 640,
            height: 480,
          }}
        />

        <div
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 11,
            width: 640,
            height: 480,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            fontSize: "2rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div>
            <p>Reps: {counter}</p>
            <p>Stage: {stage}</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
