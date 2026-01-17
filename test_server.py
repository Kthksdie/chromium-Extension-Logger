import http.server
import socketserver
import json
import threading
import queue
import time

PORT = 8080
clients = []
clients_lock = threading.Lock()

import os
import mimetypes

PORT = 8080
clients = []
clients_lock = threading.Lock()
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class LogRequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/events':
            self.handle_events()
            return
        
        # Serve static files
        if self.path == '/':
            filepath = os.path.join(PUBLIC_DIR, 'index.html')
        else:
            # Prevent directory traversal
            path = self.path.lstrip('/')
            filepath = os.path.join(PUBLIC_DIR, path)
        
        # Ensure we are still inside PUBLIC_DIR
        try:
            full_path = os.path.realpath(filepath)
            if not full_path.startswith(os.path.realpath(PUBLIC_DIR)):
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b"Forbidden")
                return
                
            if os.path.exists(full_path) and os.path.isfile(full_path):
                self.send_response(200)
                ctype, _ = mimetypes.guess_type(full_path)
                if ctype:
                    self.send_header('Content-Type', ctype)
                self.end_headers()
                with open(full_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"Not Found")
        except Exception as e:
            print(f"Error serving file: {e}")
            self.send_response(500)
            self.end_headers()

    def handle_events(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        q = queue.Queue()
        with clients_lock:
            clients.append(q)
        
        try:
            while True:
                try:
                    # Blocking get with timeout for keepalive
                    data = q.get(timeout=15)
                    msg = f"data: {data}\n\n"
                    self.wfile.write(msg.encode('utf-8'))
                    self.wfile.flush()
                except queue.Empty:
                    # Send comment to keep connection alive
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
        except (ConnectionAbortedError, BrokenPipeError, ConnectionResetError):
            pass
        finally:
            with clients_lock:
                if q in clients:
                    clients.remove(q)

    def do_POST(self):
        if self.path == '/log':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                log_entry = json.loads(post_data.decode('utf-8'))
                log_entry['ip'] = self.client_address[0]
                
                json_str = json.dumps(log_entry)
                print(f"Received: {json_str}")
                
                # Broadcast
                with clients_lock:
                    for q in clients:
                        q.put(json_str)
                
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b"OK")
            except Exception as e:
                print(f"Error: {e}")
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    print(f"Serving at http://localhost:{PORT}")
    server = ThreadingHTTPServer(("", PORT), LogRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
