const socket = io('/')
const videoGrid = document.getElementById('video-grid')
// const myPeer = new Peer(undefined, {
//   path: '/peerjs',
//   host: '/',
//   port: '3001'
// })
const myPeer = new Peer(undefined, {
  host: "peerjs-erdi.onrender.com",//here you can put your new URL like 420dac3efc08.ngrok.io
});

let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}


navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
  // input value
  let text = $("input");

  // when press enter send message

  // $('html').keydown(function (e) {
  //   if (e.which == 13 && text.val().length !== 0) {
  //     socket.emit('message', text.val());
  //     text.val('')
  //   }
  // });

  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      const message = text.val();
      socket.emit('message', {
        firstName: firstName, // Modify this to access the first name from your session or other source
        lastName: lastName, // Modify this to access the last name from your session or other source
        message: message
      });
      text.val('')
    }
  }); //ADDED

  socket.on("createMessage", (data) => {
    const { firstName, lastName, message } = data;
    $("ul").append(`<li class="message"><b>${firstName} ${lastName}</b><br/>${message}</li>`);
    scrollToBottom();
  });
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}


function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}



const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

function copy() {
  /* Get the text field */
  var copyText = document.getElementById("roomID_share");
  var text = document.getElementById("copied");

  /* Select the text field */
  copyText.select();
  console.log("====================================");
  console.log(copyText.select());
  console.log("====================================");
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  navigator.clipboard.writeText(copyText.value).then(
    function () {
      text.style.display = "block";
    },
    function (err) {
      console.error("Async: Could not copy text: ", err);
    }
  );
}

function join() {
  var room = document.getElementById("join_room");
  if (room.value == "") {
  } else {
    window.location.replace("/rooms/" + room.value);
  }
}

function leaveMeeting() {
  window.location.href = '/home';
}

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;


// function toggleRecording() {
//   if (!isRecording) {
//     startRecordingWithAudio();
//     isRecording = true;
//     startRecordingButton();
//   } else {
//     stopRecordingAndDownload();
//     isRecording = false;
//     stopRecordingButton();
//   }
// }

async function toggleRecording() {
  if (!isRecording) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const combinedStream = new MediaStream();

      screenStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      myVideoStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      mediaRecorder = new MediaRecorder(combinedStream);
      recordedChunks = []; // Clear the recorded chunks array
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start();

      isRecording = true;
      startRecordingButton();
    } catch (err) {
      console.error('Error accessing screen:', err);
      // Handle errors, show a message to the user, etc.
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    stopRecordingButton();
  }
} //ADDED


function startRecordingWithAudio() {
  const combinedStream = new MediaStream();

  myVideoStream.getVideoTracks().forEach(track => {
    combinedStream.addTrack(track);
  });

  myVideoStream.getAudioTracks().forEach(track => {
    combinedStream.addTrack(track);
  });

  mediaRecorder = new MediaRecorder(combinedStream);
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
}



function stopRecordingAndDownload() {
  mediaRecorder.stop();
}


const startRecordingButton = () => {

  const html = `
    <span>Stop Recording</span>
  `
  document.querySelector('.rec_button').innerHTML = html;

  $('#recButton').removeClass("notRec");
  $('#recButton').addClass("Rec");
}

const stopRecordingButton = () => {

  const html = `
    <span>Start Recording</span>
  `
  document.querySelector('.rec_button').innerHTML = html;

  $('#recButton').removeClass("Rec");
  $('#recButton').addClass("notRec");
}

function handleDataAvailable(event) {
  recordedChunks.push(event.data);
  downloadRecording();
}


function downloadRecording() {
  const blob = new Blob(recordedChunks, { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = url;
  a.download = 'recorded-video.mp4';
  a.click();
  window.URL.revokeObjectURL(url);
}
