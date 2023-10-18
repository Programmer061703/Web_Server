from typing import Mapping, Any, Callable, Optional, Dict
from http.server import BaseHTTPRequestHandler, HTTPServer
import webbrowser
import urllib.parse as urlparse
import json
from datetime import datetime, timedelta
import sys
import os
import requests
import time
import signal
import traceback
import threading
import atexit

port = 0

def log(s:str) -> None:
    print(f'{datetime.now()} {s}', file=sys.stderr)

def delay_open_url_helper(url: str, delay: float) -> None:
    time.sleep(delay)
    log(f'Opening {url}')
    webbrowser.open(url, new=2)

def delay_open_url(url: str, delay: float) -> None:
    t = threading.Thread(target=delay_open_url_helper, args=(url, delay))
    t.start()

ext_to_mime_types = {
    '.svg': 'image/svg+xml',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.ico': 'image/png',
    '.js': 'text/javascript',
    '.zip': 'application/zip',
}

keep_going = True
simpleWebServerPages: Mapping[str, Any] = {}

class MyRequestHandler(BaseHTTPRequestHandler):
    def __init__(self, *args: Any) -> None:
        BaseHTTPRequestHandler.__init__(self, *args)

    def log_message(self, format:str, *args:Any) -> None:
        return

    def send_file(self, filename: str, content: str) -> None:
        self.send_response(200)
        _, ext = os.path.splitext(filename)
        if ext in ext_to_mime_types:
            self.send_header('Content-type', ext_to_mime_types[ext])
        else:
            self.send_header('Content-type', 'text/html')
        if ext == '.zip':
            self.send_header('Content-Disposition', 'attachment')
        self.end_headers()
        if isinstance(content, str):
            self.wfile.write(bytes(content, 'utf8'))
        else:
            try:
                self.wfile.write(content)
            except BaseException as e:
                log(f'Problem sending file: {filename}')
                raise e

    def do_HEAD(self) -> None:
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self) -> None:
        ip_address = self.client_address[0]

        # Parse url
        url_parts = urlparse.urlparse(self.path)
        filename = url_parts.path
        if filename[0] == '/':
            filename = filename[1:]

        # Parse query
        q = urlparse.parse_qs(url_parts.query)
        q = { k:(q[k][0] if len(q[k]) == 1 else q[k]) for k in q } # type: ignore

        # Get content
        if filename in simpleWebServerPages:
            content = simpleWebServerPages[filename](q)['content']
        else:
            try:
                with open(filename, 'rb') as f:
                    content = f.read()
            except:
                log(f'current working directory: {os.getcwd()}')
                traceback.print_exc()
                content = f'404 {filename} not found.\n'
        self.send_file(filename, content)

    def do_POST(self) -> None:
        # Parse url
        url_parts = urlparse.urlparse(self.path)
        filename = url_parts.path
        if filename[0] == '/':
            filename = filename[1:]

        # Parse content
        content_len = int(self.headers.get('Content-Length') or '')
        post_body = self.rfile.read(content_len)
        ajax_params = json.loads(post_body)

        # Generate a response
        response = simpleWebServerPages[filename](ajax_params)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(bytes(json.dumps(response), 'utf8'))

# Let's overload the handle_error method to swallow ConnectionResetErrors
class MyServer(HTTPServer):
    def handle_error(self, request: Any, client_address: Any) -> None:
        ex_type, _, _ = sys.exc_info()
        if ex_type == ConnectionResetError:
            log('Connection reset')
        else:
            log('-'*40)
            log(f'Exception occurred during processing of request from {client_address}')
            traceback.print_exc()
            log('-'*40)

def serve_pages(the_port:int, pages:Mapping[str, Callable[[Mapping[str,Any]],Any]]) -> None:
    global port
    port = the_port
    signal.signal(signal.SIGTERM, signal_handler)
    atexit.register(exit_handler)

    global simpleWebServerPages
    simpleWebServerPages = pages
    httpd = MyServer(('', port), MyRequestHandler)

    log(f'Serving on port {port}')
    global keep_going
    keep_going = True
    try:
        while keep_going:
            httpd.handle_request() # blocks until a request comes in
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    log(f'http server stopped')

# If successful, returns 'pong'.
# If not, returns some other string describing the problem.
def ping(timeout:int) -> str:
    try:
        global port
        r = requests.get(f'http://localhost:{port}/ping.html', timeout=timeout)
        return r.text
    except:
        return traceback.format_exc()

# Saves state and joins all the threads
def graceful_shutdown() -> None:
    global keep_going
    if keep_going:
        keep_going = False
        ping(1) # This unblocks "httpd.handle_request", so it will notice we want to shut down
        # todo: this would be a good place to save application state
        log(f'Shutting down');
        time.sleep(0.3) # Give the http thread a moment to shut down

def signal_handler(sig:int, frame) -> None: # type: ignore
    log(f'Got a SIGTERM')
    graceful_shutdown()
    sys.exit(0)

def exit_handler() -> None:
    graceful_shutdown()
