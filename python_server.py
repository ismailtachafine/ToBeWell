from flask import Flask, request, jsonify
from deepface import DeepFace
import traceback
import os
import cv2

app = Flask(__name__)

@app.route('/analyze_emotion', methods=['POST'])
def analyze_emotion():
    try:
        video_file = request.files['video']

        # Save the file temporarily to obtain its path
        temp_path = 'temp_video.mp4'
        video_file.save(temp_path)

        # Read the video file using OpenCV
        cap = cv2.VideoCapture(temp_path)
        _, frame = cap.read()

        # Check if the frame is not None
        if frame is not None:
            # Analyze emotion using DeepFace
            print(f"Analyzing emotion for file: {temp_path}")
            result = DeepFace.analyze(frame, actions=['emotion'])
            print("Emotion analysis result:", result)

            # Clean up resources
            cap.release()

            dominant_emotion = result[0]['dominant_emotion']
            return jsonify({'emotion': dominant_emotion})
        else:
            # Clean up resources
            cap.release()
            os.remove(temp_path)
            raise ValueError("Failed to read video frame.")
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
