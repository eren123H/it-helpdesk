const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/ws');
ws.on('open', () => {
  console.log('Bağlandı!');
  ws.close();
});
ws.on('error', (err) => {
  console.error('Hata:', err.message);
});
