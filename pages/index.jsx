const socketio = require("socket.io-client");
const Peer = require("simple-peer")
import Head from 'next/head';
import { useState, useEffect } from 'react';
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8000';
const io = socketio.io(URL, {autoConnect: false});

import MuteMicrophoneButton from '../components/MuteMicrophoneButton.jsx'
import DisableCameraButton from '../components/DisableCameraButton.jsx';
import DisableСhatButton from '../components/DisableChatButton.jsx';

import VideoGrid from '../components/VideoGrid.jsx';

let uid;
let connectedIds;

let peerConnections = {};

let mediaStream;

let isPolite = [];
let isMakingOffer = [];

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

  function isVideoPresent(videosList, videoId) {
    let isPresent = false;
    videosList.forEach(video => {
      if (video.id === videoId) {
        isPresent = true;
      }
    });
    return isPresent;
  }

  function addVideoToGrid(stream, id, muted = false)
  {
    console.log(`add video to grid with id: ${id}`);
    let video = {stream: stream, id: id, muted: muted};
    setVideos(videos => {
      if (isVideoPresent(videos, id))
      {
        return videos;
      }
      return [...videos, video]
    });
  }

  function removeVideoFromGrid(videoId)
  {
    console.log(`remove video from grid with id: ${videoId}`);
    setVideos(videos => videos.filter(video => video.id !== videoId));  
  }
    
  async function handleSignalingData(fromId, data) {
    let peerConnection = peerConnections[fromId];
    try {
      if (data.type === "offer") {
        console.log(`Received offer from ${fromId}: ${data.description.sdp}`);

        const offerCollision = isMakingOffer[fromId] || peerConnection.signalingState !== "stable";

        const ignoreOffer = offerCollision && !isPolite[fromId];
        if (ignoreOffer) {
          console.log(`Offer from ${fromId} ignored`);
          return;
        }

        await peerConnection.setRemoteDescription(data.description);
        await peerConnection.setLocalDescription();
        io.emit("signal", uid, fromId, { type: "answer", description: peerConnection.localDescription });
      }
      else if (data.type == "answer") {
        console.log(`Received answer from ${fromId}: ${data.description.sdp}`);
        await peerConnection.setRemoteDescription(data.description);
      }
      else if (data.type === "newIceCandidate") {
          console.log(`Received new ice candidate from ${fromId}`);
          await peerConnection.addIceCandidate(data.candidate);
      }
    }
    catch (error) {
      console.log(`onSignalingData error: ${error}`);
    }
  }

  function handleIceConnectionStateChangeEvent() {
    console.log(`Ice connection state for ${this.id} changed to ${this.iceConnectionState}`);
  }

  function handleIceSignatingStateChangeEvent() {
    console.log(`Ice signaling state for ${this.id} changed to ${this.signalingState}`)
  }

  function handleIceGatheringStateChangeEvent() {
    console.log(`Ice gathering state for ${this.id} changed to ${this.iceGatheringState}`);
  }

  function handleAddTrackEvent(event) {
    console.log(`Received track from ${this.id}`);
    addVideoToGrid(event.streams[0], this.id, false);
  }

  async function handleNegotiationNeededEvent() {
    try {
      isMakingOffer[this.id] = true;
      await this.setLocalDescription();
      io.emit("signal", uid, this.id, { type: "offer", description: this.localDescription});
      console.log(`Sending offer to ${this.id} with description: ${description}`);
    }
    catch(err) {
      console.log(`OnNegotiation error: ${err}`);
    }
    finally {
      isMakingOffer[this.id] = false;
      console.log(`Finished sending offer to ${this.id}`);
    }
  }

  function handleIceCanditateEvent({ candidate }) {
    io.emit("signal", uid, this.id, { type: "newIceCandidate", candidate: candidate});
    console.log(`OnNewIceCandidate for connection with id ${this.id}`);
  }

  function createPeerConnection() {
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

    let peerConnection = new RTCPeerConnection(peerConfig);
    peerConnection.onicecandidate = handleIceCanditateEvent;
    peerConnection.ontrack = handleAddTrackEvent;
    peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    peerConnection.oniceconnectionstatechange = handleIceConnectionStateChangeEvent;
    peerConnection.onsignalingstatechange = handleIceSignatingStateChangeEvent;
    peerConnection.onicegatheringstatechange = handleIceGatheringStateChangeEvent;
    return peerConnection;
  }

  function startPeerConnection(id) {
    let newPeerConnection = createPeerConnection();
    newPeerConnection.id = id;
    peerConnections[id] = newPeerConnection;

    mediaStream.getTracks().forEach((track) => {
      newPeerConnection.addTrack(track, mediaStream);
    });

    console.log(`Started connection with ${id}`);
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
                peerConnections[id].close();
                removeVideoFromGrid(id);
                delete peerConnections[id];
                delete isMakingOffer[id];
                delete isPolite[id];
            }
        });
        const initiator = initiatorId === uid;
        ids.forEach((id) => {
            if (id === uid || peerConnections[id]) {
                return
            }
            startPeerConnection(id);
            isPolite[id] = initiator;
            /*
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
            */
        });
    });
    
    io.on("signal", (fromId, toId, data) => {
        console.log(`Received signaling data from ${fromId}`);
        if (!(toId === uid)) {
            console.log("Shouldn't received signaling data");
            return;
        }
        if (peerConnections[fromId]) {
            handleSignalingData(fromId, data);
        }
        else {
          console.log(`Connection with ${toId} doesn't exist`);
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