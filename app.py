from flask import Flask, request, jsonify
import cv2
import mediapipe as mp
import numpy as np

app = Flask(__name__)

# Initialize mediapipe pose and drawing utils
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    """Calculate the angle between three points."""
    a = np.array(a)  # First point
    b = np.array(b)  # Mid point
    c = np.array(c)  # End point

    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle

@app.route('/detect', methods=['POST'])
def detect():
    file = request.files['image']
    image = np.fromstring(file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # Initialize counter variables
    counter = 0
    stage = None

    # Process the image using MediaPipe
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)

        try:
            landmarks = results.pose_landmarks.landmark

            # Get coordinates
            shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

            # Calculate angle
            angle = calculate_angle(shoulder, elbow, wrist)

            # Curl counter logic
            if angle > 160:
                stage = "down"
            if angle < 30 and stage == 'down':
                stage = "up"
                counter += 1

        except:
            pass

        # Return the results as JSON
        return jsonify({"counter": counter, "stage": stage})

if __name__ == '__main__':
    app.run(debug=True)
