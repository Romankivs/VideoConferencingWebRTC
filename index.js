const express = require("express");
var cookieParser = require('cookie-parser')
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

    let socketUsernames = {};
    
    io.use(function(socket, next){
        console.log(socket.handshake.auth.token)
        next()
    });

    io.on("connection", (socket) => {
        console.log(`Client with id: ${socket.id} connected`);
        clientSockets.push(socket);

        socket.on("join-room", (msg) => {
            console.log(`${msg.username} joined the room with id: ${msg.room}`);
            socketUsernames[socket.id] = msg.username;
            socket.join(msg.room);
        });
    
        socket.on("disconnect", () => {
            console.log(`Client with id: ${socket.id} disconnected`);
            clientSockets.splice(clientSockets.indexOf(socket), 1);
            delete socketUsernames[socket.id];
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
        let roomParticipantsInfo = [];
        socketsInRoom.forEach(socketId => {
            roomParticipantsInfo.push({ id: socketId, username: socketUsernames[socketId] });
        });
        io.to(roomId).emit("ids", roomParticipantsInfo, initiatorId);
    
        console.log(`Current client ids: ${JSON.stringify(roomParticipantsInfo)} Initiator id: ${initiatorId} for room: ${roomId}`);
    }
    
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json()); 
    const cookieSecret = "M0AFZDGeMZk9NaMjTOve";
    app.use(cookieParser(cookieSecret));

    app.get('', (req, res) => {
        return res.redirect('/join-room');
    })

    app.get('/rooms/:roomId', (req, res) => {
        console.log(`Room id: ${req.params.roomId}`);
        console.log('Cookies: ', req.signedCookies);
        if (!req.signedCookies['username'])
        {
            res.cookie('roomId', req.params.roomId, {
                maxAge: 900000, httpOnly: true, signed: true, secret: cookieSecret
            })
            return res.redirect('/join-room');
        }
        return nextApp.render(req, res, '/room', {});
    });

    app.get('*', (req, res) => {
        return handle(req, res);
    });

    app.post('/join-room', (req, res) => {
        if (!req.body.username || !req.body.roomId)
            return res.redirect('/join-room');
            
        console.log(req.body.username);
        console.log(req.body.roomId);
        req.res.cookie('username', req.body.username, {
            maxAge: 900000, httpOnly: true, signed: true, secret: cookieSecret
        });
        res.redirect('/rooms/' + req.body.roomId);
    });

    server.listen(port, () => {
        console.log(`Server is listening on port ${port}`)
    });
})