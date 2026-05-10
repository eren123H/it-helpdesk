const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

// userId → Set<WebSocket>  (bir kullanıcı birden fazla sekme açabilir)
const clients = new Map();

function initWsServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let userId = null;

    // İlk mesaj mutlaka auth olmalı: { type: 'auth', token: '...' }
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);

        if (msg.type === 'auth' && !userId) {
          const decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          userId = decoded.id;

          if (!clients.has(userId)) clients.set(userId, new Set());
          clients.get(userId).add(ws);

          ws.send(JSON.stringify({ type: 'auth_ok' }));
          console.log(`🔌 WS bağlandı: user#${userId} (toplam: ${wss.clients.size})`);
        }
      } catch {
        ws.close(1008, 'Unauthorized');
      }
    });

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
        console.log(`🔌 WS ayrıldı: user#${userId} (toplam: ${wss.clients.size})`);
      }
    });

    ws.on('error', (err) => console.error('WS hata:', err.message));

    // Bağlantı kurulduğunda 30sn içinde auth gelmezse kapat
    const authTimeout = setTimeout(() => {
      if (!userId) ws.close(1008, 'Auth timeout');
    }, 30000);
    ws.on('close', () => clearTimeout(authTimeout));
  });

  return wss;
}

// Belirli bir kullanıcıya mesaj gönder
function sendToUser(userId, data) {
  const sockets = clients.get(userId);
  if (!sockets || sockets.size === 0) return;
  const msg = JSON.stringify(data);
  sockets.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg); // 1 = OPEN
  });
}

// Birden fazla kullanıcıya mesaj gönder
function sendToUsers(userIds, data) {
  userIds.forEach(id => sendToUser(id, data));
}

module.exports = { initWsServer, sendToUser, sendToUsers };
