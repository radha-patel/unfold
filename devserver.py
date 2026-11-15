#!/usr/bin/env python3
"""Dependency-free local preview with live reload and no service-worker caching."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse, hashlib, time, threading, webbrowser
ROOT = Path(__file__).resolve().parent / 'docs'
SCRIPT = '''<script type="module">
if ('serviceWorker' in navigator) {
 const old = await navigator.serviceWorker.getRegistrations();
 await Promise.all(old.map(reg => reg.unregister()));
 if (navigator.serviceWorker.controller) { location.reload(); } else { await import('./app.js'); }
} else { await import('./app.js'); }
let revision;
const changes = new EventSource('/__changes');
changes.onmessage = event => { if(revision && revision !== event.data) location.reload(); revision = event.data; };
</script>'''
def revision():
    files = sorted(p for p in ROOT.rglob('*') if p.is_file())
    return hashlib.sha256(''.join(f'{p.relative_to(ROOT)}:{p.stat().st_mtime_ns}:{p.stat().st_size}' for p in files).encode()).hexdigest()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/__changes':
            self.send_response(200); self.send_header('Content-Type','text/event-stream'); self.end_headers()
            try:
                while True:
                    self.wfile.write(('data: '+revision()+'\n\n').encode()); self.wfile.flush(); time.sleep(1)
            except (BrokenPipeError, ConnectionResetError): pass
        elif path in ('/', '/index.html'):
            content=(ROOT/'index.html').read_text().replace('<script type="module" src="./app.js"></script>',SCRIPT).encode()
            self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content)
        else: super().do_GET()
    def log_message(self, format, *args):
        if '__changes' not in str(args): super().log_message(format,*args)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4173);parser.add_argument('--open',action='store_true');args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    url=f'http://localhost:{args.port}'
    print(f'Unfold live preview: {url}\nKeep this terminal open. Save any file in docs/ to refresh the browser.\nPress Ctrl+C to stop.',flush=True)
    if args.open: threading.Timer(.5, lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
