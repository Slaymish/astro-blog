from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Cross-Origin-Opener-Policy','same-origin')
  self.send_header('Cross-Origin-Embedder-Policy','require-corp')
  super().end_headers()
 def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',4373),partial(Handler,directory='/Users/hamishburke/Documents/Codex/project-media-2026-10-10/assets')).serve_forever()
