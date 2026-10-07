import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '../dist');
const build = spawnSync(process.execPath, [resolve(import.meta.dirname, 'build.mjs')], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const portIndex = process.argv.indexOf('--port');
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4187;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port must be between 1 and 65535');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
    if (!path.startsWith(root + sep)) { response.writeHead(403).end('Forbidden'); return; }
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('页面不存在'); }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Run npm run dev -- --port 4188` : error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`Library: http://localhost:${port}`));
