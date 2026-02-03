#!/usr/bin/env python3
"""
Simple deployment webhook server for TT ERP
Listens for POST requests and triggers deployment
"""

import http.server
import socketserver
import subprocess
import os
import json
from urllib.parse import urlparse, parse_qs

PORT = 8080
DEPLOY_SECRET = "vega_deploy_secret_2024"

class DeployHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        # Check path
        if parsed_path.path != '/deploy':
            self.send_error(404)
            return
        
        # Read body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        # Verify secret
        try:
            data = json.loads(body)
            if data.get('secret') != DEPLOY_SECRET:
                self.send_error(401, 'Unauthorized')
                return
        except:
            self.send_error(400, 'Bad Request')
            return
        
        # Trigger deployment
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'deploying'}).encode())
        
        # Run deployment in background
        subprocess.Popen(['bash', '/home/ubuntu/.openclaw/workspace/tt_erp/deploy.sh', DEPLOY_SECRET])
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

print(f"Starting deploy webhook server on port {PORT}...")
with socketserver.TCPServer(("", PORT), DeployHandler) as httpd:
    httpd.serve_forever()
