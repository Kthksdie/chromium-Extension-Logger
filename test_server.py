import http.server
import socketserver
import json

PORT = 8080

class LogRequestHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/log':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                log_entry = json.loads(post_data.decode('utf-8'))
                # Add the sender's IP to the log entry
                log_entry['ip'] = self.client_address[0]
                print(f"Received Log: {json.dumps(log_entry, indent=2)}")
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"OK")
            except Exception as e:
                print(f"Error parsing log: {e}")
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

print(f"Serving at port {PORT}")
with socketserver.TCPServer(("", PORT), LogRequestHandler) as httpd:
    httpd.serve_forever()
