const WebSocket = require('ws');

// Connect to the running backend WebSocket server
const ws = new WebSocket('ws://localhost:5000');

const nodes = ['AST_PARSER_NODE_01', 'GRAPH_COMPILER_NODE_02', 'RPC_ORCHESTRATOR_03', 'VECTOR_EMBEDDER_04'];
const operations = ['AST_NODE_TRANSFORM', 'DYNAMIC_COMPILER_OPTIMIZE', 'RPC_PAYLOAD_DISPATCH', 'RECURSIVE_EMBED_EVAL'];

ws.on('open', () => {
  console.log('⚡ Microservice Generator Connected to Pipeline.');

  // Stream dynamic log payloads every 1.5 seconds
  setInterval(() => {
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    const randomOp = operations[Math.floor(Math.random() * operations.length)];
    const randomLatency = Math.floor(Math.random() * 80) + 5;

    const payload = {
      nodeId: randomNode,
      operation: randomOp,
      latencyMs: randomLatency
    };

    console.log(`[CLIENT STREAM] Emitting payload: ${randomNode} -> ${randomOp} (${randomLatency}ms)`);
    ws.send(JSON.stringify(payload));
  }, 1500);
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log(' [SERVER RESPONSE] Ingested & Signed:', response);
});

ws.on('error', (err) => {
  console.error('WebSocket Client Error:', err.message);
});