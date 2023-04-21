const express = require("express");
const http = require("http");
const socketio = require("socket.io")
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
    const app = express();
    const port = process.env.PORT || 8000;
    const server = http.createServer(app);
    
    const io = new socketio.Server(server);
    
    let clientSockets = [];
    
    io.use(function(socket, next){
        console.log(socket.handshake.auth.token)
        next()
    });

    io.on("connection", (socket) => {
        console.log(`Client with id: ${socket.id} connected`);
        clientSockets.push(socket);

        socket.on("join-room", (msg) => {
            socket.join(msg.room);
        });
    
        socket.on("disconnect", () => {
            console.log(`Client with id: ${socket.id} disconnected`);
            clientSockets.splice(clientSockets.indexOf(socket), 1);
        });
    
        socket.on("signal", (fromId, toId, data) => {
            console.log(`Received signal info from ${fromId} to ${toId}`);
            io.to(toId).emit("signal", fromId, toId, data);
        });
    });

    io.of('/').adapter.on('join-room', (room, id) => {
        console.log(`Socket with id: ${id} joined the room: ${room}`);
        if (room != id)
            clientNumberUpdated(room, id);
    });
    
    io.of('/').adapter.on('leave-room', (room, id) => {
        console.log(`Socket with id: ${id} left the room: ${room}`);
        if (room != id)
            clientNumberUpdated(room);
    });

    io.of('/').adapter.on('create-room', (room) => {
        console.log(`Created room with id: ${room}`);
    })

    io.of('/').adapter.on('delete-room', (room) => {
        console.log(`Deleted room with id: ${room}`);
    })

    function clientNumberUpdated(roomId, initiatorId = null) {
        console.log(io.of('/').adapter.rooms);

        const socketsInRoom = io.of('/').adapter.rooms.get(roomId);
        const socketsInRoomArray = Array.from(socketsInRoom);
        io.to(roomId).emit("ids", socketsInRoomArray, initiatorId);
    
        console.log(`Current client ids: ${socketsInRoomArray} Initiator id: ${initiatorId} for room: ${roomId}`);
    }
    
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json()); 

    app.get('/rooms/:roomId', (req, res) => {
        console.log(req.params.roomId);
        return handle(req, res);
    });

    app.get('*', (req, res) => {
        return handle(req, res);
    });

    app.post('/join-room', (req, res) => {
        console.log(req.body.username);
        console.log(req.body.roomId);
        res.redirect('/rooms/' + req.body.roomId);
    });

    server.listen(port, () => {
        console.log(`Server is listening on port ${port}`)
    });
})