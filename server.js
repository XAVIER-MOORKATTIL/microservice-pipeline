require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

// Server Configuration Constants
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SYSTEM_SECRET = process.env.STRICT_EQUALITY_HASH || crypto.randomBytes(16).toString('hex');

// MongoDB Telemetry Model Initialization
const TelemetryLogSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  operation: { type: String, required: true },
  latencyMs: { type: Number, required: true },
  handshakeSig: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const TelemetryLog = mongoose.model('TelemetryLog', TelemetryLogSchema);

// Express Core App Setup
const app = express();
app.use(express.json());

// Cryptographic HMAC Generator
const computeHMAC = (payload) => {
  return crypto.createHmac('sha256', SYSTEM_SECRET)
    .update(payload || 'default')
    .digest('hex');
};

// Route Definitions
app.get('/status', (req, res) => {
  res.json({ status: 'ACTIVE', signatureKey: SYSTEM_SECRET });
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await TelemetryLog.find().sort({ timestamp: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs from database', details: err.message });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const metrics = await TelemetryLog.aggregate([
      {
        $group: {
          _id: '$nodeId',
          totalOperations: { $sum: 1 },
          avgLatencyMs: { $avg: '$latencyMs' },
          maxLatencyMs: { $max: '$latencyMs' },
          minLatencyMs: { $min: '$latencyMs' }
        }
      },
      { $sort: { avgLatencyMs: -1 } }
    ]);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute telemetry metrics', details: err.message });
  }
});

// Telemetry Web Interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Telemetry Ingestion Console</title>
  <style>
    body { background: #090d16; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; padding: 24px; margin: 0; }
    h1 { color: #38bdf8; margin-bottom: 5px; }
    .status-badge { color: #34d399; font-weight: bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .panel { background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; }
    .card { background: #0f172a; padding: 10px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #38bdf8; }
    .node { color: #4ade80; font-weight: bold; }
    .op { color: #f472b6; }
    .latency { color: #fbbf24; }
    .sig { font-size: 0.7rem; color: #64748b; margin-top: 4px; word-break: break-all; }
    #feed { max-height: 480px; overflow-y: auto; }
  </style>
</head>
<body>
  <h1>System Telemetry Engine</h1>
  <div>Pipeline Status: <span class="status-badge">ONLINE</span></div>
  
  <div class="grid">
    <div class="panel">
      <h3>Live Streaming Feed</h3>
      <div id="feed"></div>
    </div>
    <div class="panel">
      <h3>Node Analytics Summary</h3>
      <pre id="analytics">Loading metrics...</pre>
    </div>
  </div>

  <script>
    const feed = document.getElementById('feed');
    const analyticsEl = document.getElementById('analytics');

    function createCard(data) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = \`
        <div><span class="node">\${data.nodeId}</span> → <span class="op">\${data.operation}</span></div>
        <div>Latency: <span class="latency">\${data.latencyMs}ms</span></div>
        <div class="sig">HMAC: \${data.sig || data.handshakeSig}</div>
      \`;
      feed.prepend(card);
    }

    async function loadInitialData() {
      try {
        const logsRes = await fetch('/api/logs');
        const logs = await logsRes.json();
        if (Array.isArray(logs)) {
          logs.reverse().forEach(createCard);
        }
        refreshMetrics();
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    async function refreshMetrics() {
      try {
        const res = await fetch('/api/analytics');
        const metrics = await res.json();
        analyticsEl.textContent = JSON.stringify(metrics, null, 2);
      } catch (err) {
        analyticsEl.textContent = 'Failed to load metrics.';
      }
    }

    const ws = new WebSocket('ws://' + window.location.host);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.status === 'INGESTED') {
        createCard(payload);
        refreshMetrics();
      }
    };

    loadInitialData();
  </script>
</body>
</html>
  `);
});

// HTTP & WebSocket Server Setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', async (rawData) => {
    try {
      const payload = JSON.parse(rawData);
      const hmacSignature = computeHMAC(payload.nodeId);

      const record = new TelemetryLog({
        nodeId: payload.nodeId,
        operation: payload.operation,
        latencyMs: payload.latencyMs,
        handshakeSig: hmacSignature
      });

      await record.save();

      const responsePayload = JSON.stringify({
        status: 'INGESTED',
        id: record._id,
        nodeId: record.nodeId,
        operation: record.operation,
        latencyMs: record.latencyMs,
        sig: hmacSignature
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(responsePayload);
        }
      });
    } catch (err) {
      ws.send(JSON.stringify({ status: 'ERROR', message: err.message }));
    }
  });
});

// Express & WebSocket Server Execution Start
server.listen(PORT, () => {
  console.log(`Telemetry Server running on port ${PORT}`);
  console.log(`Active Execution Signature: ${SYSTEM_SECRET}`);
});

// Asynchronous MongoDB Atlas Connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas Cloud Cluster.');
  })
  .catch((err) => {
    console.error('MongoDB Atlas Connection Error Details:', err.message);
  });