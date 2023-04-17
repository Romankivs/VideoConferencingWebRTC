const socketio = require("socket.io-client");
const Peer = require("simple-peer")
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8000';
const io = socketio.io(URL, {autoConnect: false});

import MuteMicrophoneButton from '../components/MuteMicrophoneButton.jsx'
import DisableCameraButton from '../components/DisableCameraButton.jsx';
import DisableСhatButton from '../components/DisableChatButton.jsx';

import VideoGrid from '../components/VideoGrid.jsx';

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

function toggleMute(muted) {
  mediaStream.getAudioTracks()[0].enabled = muted;
}

function toggleCamera(disabled) {
  mediaStream.getVideoTracks()[0].enabled = disabled;
}

function toggleChat(disabled) {
  // TODO
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
        <MuteMicrophoneButton onChange={toggleMute}/>
        <DisableCameraButton onChange={toggleCamera} />
        <DisableСhatButton onChange={toggleChat}/>
      </div>
    </div>
  </>
  )
}