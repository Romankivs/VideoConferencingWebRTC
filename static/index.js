const socketio = require("socket.io-client");
const Peer = require("simple-peer")

const io = socketio.io();

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

io.on("connect", (socket) => {
    console.log(`Connected to server with id: ${io.id}`);
    uid = io.id;
});

io.on("ids", (ids, initiatorId) => {
    connectedIds = ids;
    console.log(`Received ids: ${connectedIds} with initiator ${initiatorId}`);
    // cleanup peer connections not in peer ids
    Object.keys(peerConnections).forEach((id) => {
        if (!ids.includes(id)) {
            peerConnections[id].destroy();
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
            addVideoToGrid(stream);
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

// get video/voice stream
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(gotMedia).catch((err) => { console.log(err)})

function gotMedia(stream)
{
    io.emit("ready");
    mediaStream = stream;
    addVideoToGrid(mediaStream);
}

function addVideoToGrid(stream)
{
    let video = document.createElement('video');
    video.muted = false;
    video.height = 240;
    video.width = 320;
    video.autoplay = true;
    video.srcObject = stream;

    let grid = document.getElementById("videoGrid");
    grid.appendChild(video);
}