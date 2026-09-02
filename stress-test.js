const WebSocket = require('ws');

const TARGET_URL = 'ws://localhost:5000';
const CONCURRENT_WORKERS = 10;
const MESSAGES_PER_WORKER = 50;

const nodes = ['AST_PARSER_NODE_01', 'GRAPH_COMPILER_NODE_02', 'RPC_ORCHESTRATOR_03', 'VECTOR_EMBEDDER_04'];
const operations = ['AST_NODE_TRANSFORM', 'DYNAMIC_COMPILER_OPTIMIZE', 'RPC_PAYLOAD_DISPATCH', 'RECURSIVE_EMBED_EVAL'];

console.log(`🚀 Launching Concurrency Test: ${CONCURRENT_WORKERS} workers x ${MESSAGES_PER_WORKER} payloads...`);

let totalIngested = 0;
const startTime = Date.now();

for (let w = 0; w < CONCURRENT_WORKERS; w++) {
  const ws = new WebSocket(TARGET_URL);

  ws.on('open', () => {
    let sent = 0;
    const interval = setInterval(() => {
      if (sent >= MESSAGES_PER_WORKER) {
        clearInterval(interval);
        ws.close();
        return;
      }

      const payload = {
        nodeId: nodes[Math.floor(Math.random() * nodes.length)],
        operation: operations[Math.floor(Math.random() * operations.length)],
        latencyMs: Math.floor(Math.random() * 95) + 5
      };

      ws.send(JSON.stringify(payload));
      sent++;
    }, 50); // Emit every 50ms per worker thread
  });

  ws.on('message', () => {
    totalIngested++;
    if (totalIngested === CONCURRENT_WORKERS * MESSAGES_PER_WORKER) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ CONCURRENCY TEST COMPLETE!`);
      console.log(`Successfully ingested ${totalIngested} signed records in ${elapsed} seconds.`);
      console.log(`Throughput: ${(totalIngested / elapsed).toFixed(1)} req/sec`);
    }
  });
}