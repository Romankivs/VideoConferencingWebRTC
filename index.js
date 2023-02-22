const express = require("express");
const http = require("http");
const socketio = require("socket.io")

const app = express();
const port = process.env.PORT || 8000;
const server = http.createServer(app);

app.use(express.static("static"));

const io = new socketio.Server(server);

let clientSockets = [];

io.on("connection", (socket) => {
    console.log(`Client with id: ${socket.id} connected`);
    socket.on("ready", () => {

        clientSockets.push(socket);
        clientNumberUpdated(socket.id);
    
    });

    socket.on("disconnect", () => {
        console.log(`Client with id: ${socket.id} disconnected`);
        clientSockets.splice(clientSockets.indexOf(socket), 1);
        clientNumberUpdated();
    });

    socket.on("signal", (fromId, toId, data) => {
        console.log(`Received signal info from ${fromId} to ${toId}`);
        io.to(toId).emit("signal", fromId, toId, data);
    });
});

function clientNumberUpdated(initiatorId = null) {
    let clientIds = [];
    clientSockets.forEach((socket) => {
        clientIds.push(socket.id);
    });
    io.emit("ids", clientIds, initiatorId);

    console.log("Current client ids: " + clientIds + " Initiator id: " + initiatorId);
}



server.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
});