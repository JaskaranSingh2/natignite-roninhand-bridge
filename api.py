import json
import http.server
import socketserver
import time
import signal
import sys
import socket
import platform
from scservo_sdk import *
import serial
import serial.tools.list_ports
import threading
import copy
import itertools
import fnmatch


class GestureHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle preflight OPTIONS requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/':
            print("Handling GET / (serving index.html)")
            self.path = '/index.html'
            super().do_GET()
        elif self.path == '/signals':
            print("Handling GET /signals")
            with open("signals.json", "r") as file:
                data = json.load(file)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
        elif self.path == '/mapping':
            print("Handling GET /mapping")
            with open("mapping.json", "r") as file:
                data = json.load(file)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
        else:
            super().do_GET()

    def do_POST(self):
        global groupSyncWrite
        
        if server_shutdown:
            print("Server is shutting down, ignoring POST request")
            self.send_response(503)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            return

        start_time = time.time()
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        print(f"Received POST request on {self.path}")

        if self.path == '/add_signal':
            signal_name = data['signal']
            signal_types=data["signal_types"]
            with open("signals.json", "r") as file:
                data = json.load(file)
            data[signal_name]=signal_types
            signal_mapping={}
            value_lists = list(data.values())
            combinations = itertools.product(*value_lists)
            results = ["".join(combo) for combo in combinations]
            for i in results:
                signal_mapping[i]=None
            with open("mapping.json", "w") as file:
                json.dump(signal_mapping, file, indent=4) 
            with open("data.json", "w") as file:
                json.dump(data, file, indent=4) 
            end_time=time.time()
            print(f"Update request handled in {end_time-start_time:.2f} ms")
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
        if self.path == '/remove_signal':
            signal_name = data['signal']
            with open("signals.json", "r") as file:
                data = json.load(file)
            del data[signal_name]
            signal_mapping={}
            value_lists = list(data.values())
            combinations = itertools.product(*value_lists)
            results = ["".join(combo) for combo in combinations]
            for i in results:
                signal_mapping[i]=None
            with open("mapping.json", "w") as file:
                json.dump(signal_mapping, file, indent=4) 
            with open("data.json", "w") as file:
                json.dump(data, file, indent=4) 
            end_time=time.time()
            print(f"Update request handled in {end_time-start_time:.2f} ms")
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
        if self.path == '/add_mapping':
            signal = data['signal']
            mapsto=data["mapsto"]
            with open("signals.json", "r") as file:
                data = json.load(file)
            matches = [s for s in data.keys if fnmatch.fnmatch(s, signal)]
            for i in matches:
                data[i]=mapsto
            with open("mapping.json", "w") as file:
                json.dump(data, file, indent=4)
            end_time=time.time()
            print(f"Update request handled in {end_time-start_time:.2f} ms")
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()


def cleanup(httpd=None):
    global server_shutdown
    server_shutdown = True
    print("Cleaning up resources...")
    try:
        if portHandler and portHandler.is_open:
            for servo_id in [int(sid.split('_')[1]) for sid in servo_limits.keys()]:
                try:
                    portHandler.setPacketTimeout(SERVO_TIMEOUT * 1000)
                    scs_comm_result, scs_error = packetHandler.write1ByteTxRx(portHandler, servo_id, ADDR_SCS_TORQUE_ENABLE, 0)
                    if scs_comm_result != COMM_SUCCESS:
                        print(f"Error disabling torque for servo {servo_id}: {packetHandler.getTxRxResult(scs_comm_result)}")
                    if scs_error != 0:
                        print(f"Error disabling torque for servo {servo_id}: {packetHandler.getRxPacketError(scs_error)}")
                except Exception as e:
                    print(f"Error disabling torque for servo {servo_id}: {e}")
            portHandler.closePort()
            print("Port closed successfully")
        if httpd:
            httpd.server_close()
            print("Server socket closed")
    except Exception as e:
        print(f"Error during cleanup: {e}")
    finally:
        print("Cleanup complete, exiting.")
        sys.exit(0)

def signal_handler(sig, frame, httpd=None):
    print('Received Ctrl+C, shutting down...')
    cleanup(httpd)

class CustomThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    timeout = 1

    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind(self.server_address)

PORT = 7000
Handler = GestureHandler

try:
    with CustomThreadingTCPServer(("", PORT), Handler) as httpd:
        signal.signal(signal.SIGINT, lambda sig, frame: signal_handler(sig, frame, httpd))
        print("Server running at http://localhost:7000")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Keyboard interrupt received, shutting down server...")
            cleanup(httpd)
        except Exception as e:
            print(f"Server error: {e}")
            cleanup(httpd)
except Exception as e:
    print(f"Failed to start server: {e}")
    cleanup()