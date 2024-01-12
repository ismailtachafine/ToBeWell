# import cv2
# from keras.models import model_from_json
# import numpy as np
# import gradio as gr
# import base64
# import os

# # Load the emotion detection model
# json_file = open("emotiondetector.json", "r")
# model_json = json_file.read()
# json_file.close()
# model = model_from_json(model_json)
# model.load_weights("emotiondetector.h5")

# haar_file = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
# face_cascade = cv2.CascadeClassifier(haar_file)

# # Define emotion labels
# labels = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

# def extract_features(image):
#     feature = np.array(image)
#     feature = feature.reshape(1, 48, 48, 1)
#     return feature / 255.0

# def detect_emotion(video_path, output_path="output.mp4"):
#     cap = cv2.VideoCapture(video_path)

#     if not cap.isOpened():
#         print("Error opening video file")
#         return None

#     fps = int(cap.get(cv2.CAP_PROP_FPS))
#     width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#     height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

#     temp_output = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height), isColor=True)

#     while True:
#         ret, frame = cap.read()

#         if not ret:
#             break

#         frame = detect_emotion_in_frame(frame)
#         temp_output.write(frame)

#     cap.release()
#     temp_output.release()

#     return output_path

# def detect_emotion_in_frame(frame):
#     gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#     faces = face_cascade.detectMultiScale(frame, 1.3, 5)

#     try:
#         for (p, q, r, s) in faces:
#             image = gray[q:q + s, p:p + r]
#             cv2.rectangle(frame, (p, q), (p + r, q + s), (255, 0, 0), 2)
#             image = cv2.resize(image, (48, 48))
#             img = extract_features(image)
#             pred = model.predict(img)
#             prediction_label = labels[pred.argmax()]
#             cv2.putText(frame, '%s' % (prediction_label), (p - 10, q - 10), cv2.FONT_HERSHEY_COMPLEX_SMALL, 2, (0, 0, 255))
#     except cv2.error as e:
#         print(f"Error processing frame: {e}")

#     return frame

# def process_video(video_path):
#     output_path = detect_emotion(video_path)
#     return output_path

# iface = gr.Interface(
#     fn=process_video,
#     inputs="file",
#     outputs="file",
#     title="Emotion Detection",
#     live=True
# )

# iface.launch()

import cv2
from keras.models import model_from_json
import numpy as np
import streamlit as st
import base64
import os

# Load the emotion detection model
json_file = open("emotiondetector.json", "r")
model_json = json_file.read()
json_file.close()
model = model_from_json(model_json)
model.load_weights("emotiondetector.h5")

haar_file = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(haar_file)

# Define emotion labels
labels = {0: 'angry', 1: 'disgust', 2: 'fear', 3: 'happy', 4: 'neutral', 5: 'sad', 6: 'surprise'}

def extract_features(image):
    feature = np.array(image)
    feature = feature.reshape(1, 48, 48, 1)
    return feature / 255.0

def detect_emotion(video_path, output_path="output.mp4"):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        st.error("Error opening video file")
        return None

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    st.write("Analyzing Emotions...")
    st.info("Please wait. This may take a while depending on the video duration.")

    temp_output = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height), isColor=True)

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        frame = detect_emotion_in_frame(frame)
        temp_output.write(frame)

    cap.release()
    temp_output.release()

    return output_path

def detect_emotion_in_frame(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(frame, 1.3, 5)

    try:
        for (p, q, r, s) in faces:
            image = gray[q:q + s, p:p + r]
            cv2.rectangle(frame, (p, q), (p + r, q + s), (255, 0, 0), 2)
            image = cv2.resize(image, (48, 48))
            img = extract_features(image)
            pred = model.predict(img)
            prediction_label = labels[pred.argmax()]
            cv2.putText(frame, '%s' % (prediction_label), (p - 10, q - 10), cv2.FONT_HERSHEY_COMPLEX_SMALL, 2, (0, 0, 255))
    except cv2.error as e:
        st.error(f"Error processing frame: {e}")

    return frame

def download_link(file_path, text):
    with open(file_path, 'rb') as f:
        data = f.read()
        b64 = base64.b64encode(data).decode()
        href = f'<a href="data:application/octet-stream;base64,{b64}" download="{os.path.basename(file_path)}">{text}</a>'
        return href

st.title("Emotion Detection")

uploaded_file = st.file_uploader("Upload a video", type=["mp4"])

if uploaded_file is not None:
    st.video(uploaded_file)

    if st.button("Detect Emotion"):
        temp_video = "temp_video.mp4"
        with open(temp_video, "wb") as f:
            f.write(uploaded_file.read())

        output_path = detect_emotion(temp_video)

        st.write("Emotion detection completed.")
        st.success("Download the processed video:")
        st.markdown(download_link(output_path, "Download Processed Video"), unsafe_allow_html=True)

        # Remove temporary video files
        os.remove(temp_video)
