const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

let serverProcess = null;

function resolveBindingPackage() {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === 'darwin') {
    return arch === 'arm64'
      ? 'chromadb-js-bindings-darwin-arm64'
      : 'chromadb-js-bindings-darwin-x64';
  }
  if (platform === 'linux') {
    return arch === 'arm64'
      ? 'chromadb-js-bindings-linux-arm64-gnu'
      : 'chromadb-js-bindings-linux-x64-gnu';
  }
  if (platform === 'win32') {
    if (arch === 'x64') return 'chromadb-js-bindings-win32-x64-msvc';
    if (arch === 'arm64') return 'chromadb-js-bindings-win32-arm64-msvc';
  }
  throw new Error(`Unsupported platform for embedded Chroma: ${platform}/${arch}`);
}

async function waitForHeartbeat(host, port, attempts = 40) {
  const { ChromaClient } = require('chromadb');
  const client = new ChromaClient({ host, port });

  for (let i = 0; i < attempts; i++) {
    try {
      await client.heartbeat();
      return client;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Chroma server did not respond on ${host}:${port}`);
}

async function startChromaServer() {
  if (serverProcess) {
    const port = parseInt(process.env.CHROMA_PORT || '8100', 10);
    const host = process.env.CHROMA_HOST || '127.0.0.1';
    await waitForHeartbeat(host, port);
    return { host, port };
  }

  const dataPath = path.join(__dirname, '../data/chroma');
  const host = process.env.CHROMA_HOST || '127.0.0.1';
  const port = parseInt(process.env.CHROMA_PORT || '8100', 10);
  const bindingPkg = resolveBindingPackage();

  const script = `
    const b = require(${JSON.stringify(bindingPkg)});
    b.cli(['chroma','run','--path',${JSON.stringify(dataPath)},'--host',${JSON.stringify(host)},'--port','${port}']);
  `;

  serverProcess = spawn(process.execPath, ['-e', script], {
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  });

  serverProcess.on('exit', (code) => {
    serverProcess = null;
  });

  await waitForHeartbeat(host, port);
  return { host, port, dataPath };
}

module.exports = { startChromaServer };
