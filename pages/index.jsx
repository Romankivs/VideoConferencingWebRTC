const socketio = require("socket.io-client");
const Peer = require("simple-peer")
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
const io = socketio.io({autoConnect: false});
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faCamera, faComment} from '@fortawesome/free-solid-svg-icons';

const peerConfig = { 
    iceServers:
    [
        {
        urls: "stun:openrelay.metered.ca:80",
        },
        {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
        },
        {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
        },
        {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
        }
    ]
};

let uid;
let connectedIds;

let peerConnections = {};

let mediaStream;

function Video({stream, id, muted}) {
  const videoRef = useRef();

  useEffect(() => {
    videoRef.current.srcObject = stream;
  }, []);

  return (
    <video ref = {videoRef} id = {id} width = {640} height = {360}
    muted = {muted} autoPlay = {true}>
    </video>
  );
}

function VideoGrid({videos}) {
  const listVideos = videos.map((video, i) =>
    <Video key = {video.id} stream = {video.stream} id = {video.id} muted = {video.muted}></Video>
  );  

  return (<div className="videoGrid" id="videoGrid">{listVideos}</div>)
}

function DisableButton({onChange, children}) {
  const [disabled, setDisabled] = useState(false);

  function toggle() {
    setDisabled(!disabled);
    onChange(disabled);
  }

  return (
    <button onClick={toggle}
    className={"actionButton"}
    style={{backgroundColor: disabled  ? '#A52A2A' : '#F0F8FF'}}>
      {children}
    </button>
  );
}

function MuteMicrophoneButton() {
  function toggleMute(muted) {
    mediaStream.getAudioTracks()[0].enabled = muted;
  }

  return (
    <>
    <DisableButton onChange={toggleMute}>
      <FontAwesomeIcon icon={faMicrophone} size={"2x"}/>
    </DisableButton>
    </>
  );
}

function DisableCameraButton() {
  function toggleCamera(disabled) {
    mediaStream.getVideoTracks()[0].enabled = disabled;
  }

  return (
    <DisableButton onChange={toggleCamera}>
          <FontAwesomeIcon icon={faCamera} size={"2x"}/>
    </DisableButton>
  );
}

function DisableСhatButton() {
  function toggleChat(disabled) {
    // TODO
  }

  return (
    <DisableButton onChange={toggleChat}>
          <FontAwesomeIcon icon={faComment} size={"2x"}/>
    </DisableButton>
  );
}

export default function App() {
  const [videos, setVideos] = useState([]);

  function addVideoToGrid(stream, id, muted = false)
  {
    console.log(`add video to grid with id: ${id}`);
    let video = {stream: stream, id: id, muted: muted};
    setVideos(videos => [...videos, video]);
  }

  function removeVideoFromGrid(videoId)
  {
    console.log(`remove video from grid with id: ${videoId}`);
    setVideos(videos => videos.filter(video => video.id !== videoId));  
  }

  useEffect(() => {
    io.on("connect", (socket) => {
        console.log(`Connected to server with id: ${io.id}`);
        uid = io.id;
        getMedia();
    });
    
    io.on("ids", (ids, initiatorId) => {
        connectedIds = ids;
        console.log(`Received ids: ${connectedIds} with initiator ${initiatorId}`);
        // cleanup peer connections not in peer ids
        Object.keys(peerConnections).forEach((id) => {
            if (!ids.includes(id)) {
                peerConnections[id].destroy();
                removeVideoFromGrid(id);
                delete peerConnections[id];
            }
        });
        const initiator = initiatorId === uid;
        ids.forEach((id) => {
            if (id === uid || peerConnections[id]) {
                return
            }
            let peer = new Peer({
                initiator: initiator,
                config: peerConfig,
                stream: mediaStream
            });
    
            peer.on('error', console.error);
            peer.on('signal', (data) => {
                console.log('Signaling data ready');
                io.emit("signal", uid, id, data);
            });
            peer.on('connect', () => {
                console.log(`Peer connection established with ${id}`);
                peer.send("DIe");
            })
            peer.on('data', (data) => console.log(`Data: ${data} from ${id}`));
            peer.on('stream', (stream) => {
                console.log("Received stream");
                addVideoToGrid(stream, id);
            });
            peerConnections[id] = peer;
        });
    });
    
    io.on("signal", (fromId, toId, data) => {
        console.log(`"Received signaling data from ${fromId}`);
        if (!(toId === uid)) {
            console.log("Shouldn't received signaling data");
            return;
        }
        if (peerConnections[fromId]) {
            peerConnections[fromId].signal(data);
        }
    });  

    function getMedia()
    {
        // get video/voice stream
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { min: 1280, ideal: 1280, max: 1280 },
                height: { min: 720, ideal: 720, max: 720 },
            },
            audio: true
        }).then(gotMedia).catch((err) => {
            console.log(err);
            // Try again after delay
            setTimeout(getMedia, 1000);
        })
    }
    
    function gotMedia(stream)
    {
        io.emit("ready");
        mediaStream = stream;
        addVideoToGrid(mediaStream, uid, true);
    }

    io.connect();

    return () => {
      io.off("connect");
      io.off("ids");
      io.off("signal");
    }
  }, []);

  return (
  <>
    <Head>
      <meta charSet="utf-8" />
      <title>Video Chat</title>
    </Head>
    <div className='main'>
      <VideoGrid videos={videos}/>
      <div className="floatingBottomRow">
        <MuteMicrophoneButton />
        <DisableCameraButton />
        <DisableСhatButton />
      </div>
    </div>
  </>
  )
}