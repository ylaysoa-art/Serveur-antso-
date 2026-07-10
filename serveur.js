const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="mg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antso Video</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 15px; }
        .container { max-width: 500px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 15px; color: #4ecca3; font-size: 24px; }
        .video-box { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; }
        video { width: 100%; height: 200px; background: #000; border-radius: 8px; object-fit: cover; }
        .controls { background: #16213e; padding: 15px; border-radius: 10px; }
        input { width: 100%; padding: 12px; margin-bottom: 10px; border: none; border-radius: 5px; font-size: 16px; }
        button { width: 100%; padding: 14px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 8px; }
        .btn-start { background: #4ecca3; color: #1a1a2e; }
        .btn-end { background: #e94560; color: white; display: none; }
        .status { text-align: center; padding: 8px; background: #0f3460; border-radius: 5px; margin-top: 8px; font-size: 14px; }
        .label { font-size: 12px; text-align: center; margin-top: 4px; color: #aaa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📹 Antso Video</h1>
        <div class="video-box">
            <div><video id="localVideo" autoplay muted playsinline></video><div class="label">Ianao</div></div>
            <div><video id="remoteVideo" autoplay playsinline></video><div class="label">Namana</div></div>
        </div>
        <div class="controls">
            <input type="text" id="roomInput" placeholder="Anaran'ny efitrano: efitrano1">
            <button class="btn-start" id="startBtn">Atombohy ny antso</button>
            <button class="btn-end" id="endBtn">Tapaho ny antso</button>
            <div class="status" id="status">Vonona hiantso</div>
        </div>
    </div>
    <script>
        const socket = io();
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const roomInput = document.getElementById('roomInput');
        const startBtn = document.getElementById('startBtn');
        const endBtn = document.getElementById('endBtn');
        const status = document.getElementById('status');
        let localStream, peerConnection, roomId;
        const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        
        startBtn.onclick = async () => {
            roomId = roomInput.value.trim();
            if (!roomId) return alert('Soraty ny anaran efitrano!');
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideo.srcObject = localStream;
                socket.emit('join-room', roomId);
                startBtn.style.display = 'none';
                endBtn.style.display = 'block';
                status.textContent = 'Miandry namana...';
            } catch (err) { alert('Tsy afaka miditra camera: ' + err.message); }
        };
        
        endBtn.onclick = () => {
            if (localStream) localStream.getTracks().forEach(t => t.stop());
            if (peerConnection) peerConnection.close();
            window.location.reload();
        };
        
        socket.on('user-connected', async () => {
            status.textContent = 'Misy namana niditra!';
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            peerConnection.ontrack = (e) => remoteVideo.srcObject = e.streams[0];
            peerConnection.onicecandidate = (e) => { if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate, roomId }); };
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer', { offer, roomId });
        });
        
        socket.on('offer', async (data) => {
            status.textContent = 'Misy miantso...';
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            peerConnection.ontrack = (e) => remoteVideo.srcObject = e.streams[0];
            peerConnection.onicecandidate = (e) => { if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate, roomId }); };
            await peerConnection.setRemoteDescription(data.offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', { answer, roomId });
            status.textContent = 'Mifandray!';
        });
        
        socket.on('answer', async (data) => { await peerConnection.setRemoteDescription(data.answer); status.textContent = 'Mifandray!'; });
        socket.on('ice-candidate', async (data) => { if (peerConnection) await peerConnection.addIceCandidate(data.candidate); });
    </script>
</body>
</html>
  `);
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);
  });
  socket.on('offer', (data) => socket.to(data.roomId).emit('offer', data));
  socket.on('answer', (data) => socket.to(data.roomId).emit('answer', data));
  socket.on('ice-candidate', (data) => socket.to(data.roomId).emit('ice-candidate', data));
});

server.listen(PORT, () => console.log('Serveur mandeha'));
