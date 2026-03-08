import http from "http";

const options = {
  hostname: "localhost",
  port: 604,
  path: "/streamable",
  method: "POST",
  headers: {
    "Content-Type": "application/x-ndjson",
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Send initialize request
const initializeRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
};

req.write(JSON.stringify(initializeRequest) + "\n");

// After a small delay, send list tools request
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  };
  req.write(JSON.stringify(listToolsRequest) + "\n");
}, 500);

// Close after 2 seconds
setTimeout(() => {
  req.end();
}, 2000);
