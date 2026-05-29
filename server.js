const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

// Antrian user: menyimpan { ws, peerId }
let queue = [];

wss.on('connection', (ws) => {
  console.log('User connected to signaling');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'find_stranger') {
        const user = { ws, peerId: data.peerId };
        
        // Cek apakah ada yang sedang menunggu
        if (queue.length > 0) {
          const partner = queue.shift();
          
          // Kirim ke masing-masing pasangan
          partner.ws.send(JSON.stringify({ type: 'matched', peerId: data.peerId }));
          ws.send(JSON.stringify({ type: 'matched', peerId: partner.peerId }));
          
          console.log(`Matched ${partner.peerId} ↔ ${data.peerId}`);
        } else {
          // Masukkan ke antrian
          queue.push(user);
          ws.send(JSON.stringify({ type: 'waiting', message: 'Mencari stranger...' }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    // Hapus dari antrian jika disconnect
    queue = queue.filter(user => user.ws !== ws);
    console.log('User disconnected from signaling');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
