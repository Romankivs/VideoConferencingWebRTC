const socketio = require("socket.io-client");

import styles from '../css_modules/Index.module.css'

import Head from 'next/head';
import { useState, useEffect } from 'react';

import FloatingBottomRow from '../components/FloatingBottomRow.jsx';
import VideoGrid from '../components/VideoGrid.jsx';
import ChatPanel from '../components/ChatPanel';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8000';
const io = socketio.io(URL, { autoConnect: false });

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

function App({ roomId }) {
  const [videos, setVideos] = useState([]);

  const [chatVisible, setChatVisible] = useState(true);

  function toggleChat(disabled) {
    setChatVisible(chatVisible => !chatVisible);
  }  

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

        const offerCollision = peerConnection.isMakingOffer || peerConnection.signalingState !== "stable";

        const ignoreOffer = offerCollision && !peerConnection.isPolite;
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
      this.isMakingOffer = true;
      await this.setLocalDescription();
      io.emit("signal", uid, this.id, { type: "offer", description: this.localDescription});
      console.log(`Sending offer to ${this.id} with description: ${description}`);
    }
    catch(err) {
      console.log(`OnNegotiation error: ${err}`);
    }
    finally {
      this.isMakingOffer = false;
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

  function startPeerConnection(id, isInitiator) {
    let newPeerConnection = createPeerConnection();
    newPeerConnection.id = id;
    newPeerConnection.isPolite = isInitiator;
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
            }
        });
        const initiator = initiatorId === uid;
        ids.forEach((id) => {
            if (id === uid || peerConnections[id]) {
                return
            }
            startPeerConnection(id, initiator);
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
      mediaStream = stream;
      console.log(`Joining room with id: ${roomId}`);
      io.emit("join-room", { room: roomId });
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
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <div className={ styles.main }>
      <VideoGrid videos={videos}/>
      {chatVisible ? <ChatPanel /> : null}
      <FloatingBottomRow toggleMute={toggleMute} toggleCamera={toggleCamera} toggleChat={toggleChat} />
    </div>
  </>
  )
}

App.getInitialProps = async (ctx) => {
  return { roomId : ctx.req.params.roomId};
}

export default App;