const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
let users = {};
io.on('connection', (socket) => {
  console.log('Misy connecte:', socket.id);
  socket.on('register', (userId) => {
    users[userId] = socket.id;
    console.log(`${userId} voasoratra anarana`);
  });
  socket.on('call-user', (data) => {
    const target = users[data.targetId];
    if (target) {
      io.to(target).emit('incoming-call', { from: data.from, offer: data.offer });
    }
  });
  socket.on('answer-call', (data) => {
    const caller = users[data.to];
    if (caller) io.to(caller).emit('call-accepted', data.answer);
  });
  socket.on('disconnect', () => {
    for (let userId in users) {
      if (users[userId] === socket.id) delete users[userId];
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur mandeha amin'ny port ${PORT}`))const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
let users = {};
io.on('connection', (socket) => {
  console.log('Misy connecte:', socket.id);
  socket.on('register', (userId) => {
    users[userId] = socket.id;
    console.log(`${userId} voasoratra anarana);
  });
  socket.on('call-user', (data) => {
    const target = users[data.targetId];
    if (target) {
      io.to(target).emit('incoming-call', { from: data.from, offer: data.offer });
    }
  });
  socket.on('answer-call', (data) => {
    const caller = users[data.to];
    if (caller) io.to(caller).emit('call-accepted', data.answer);
  });
  socket.on('disconnect', () => {
    for (let userId in users) {
      if (users[userId] === socket.id) delete users[userId];
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur mandeha amin'ny port ${PORT}`))