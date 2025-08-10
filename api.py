import json
import http.server
import socketserver
import time
from scservo_sdk import *
import itertools
import fnmatch
import copy
import ast
import requests

signal_received={}
signal_received_time={}
old_signal_received_time={}
servos=1
SERVER_URL = "http://localhost:8000"
def change_servos_position(servos,adjustment):
    current_positions = requests.get(f"{SERVER_URL}/current_positions", timeout=1).json() 
    print(current_positions)
    current_positions[f"servo_{servos}"]+=adjustment
    response=requests.post(f"{SERVER_URL}/update", json={"positions": current_positions},timeout=1)
    print(f"The response to updating the postion was {response}") 

def convert_signal_to_action(signal_received):
    print(f"The signal received was {signal_received}")
    lst = list(signal_received.values())
    with open("mapping.json", "r") as file:
        data = json.load(file)
    tasks=data[str(lst)]

    global servos
    for task in tasks:
        if task[:9]=="timesleep":
            time.sleep(int(task[9:])*1000)
        elif task[:16]=="increment_servos":
            servos+=1
            if servos>12:
                servos=1
        elif task[:16]=="decrement_servos":
            servos-=1
            if servos<1:
                servos=12
        elif task[:13]=="select_servos":
            servos=int(task[13:])
        elif task[:21]=="increase_servos_angle":
            adjustment=int(task[21:])
            change_servos_position(servos,adjustment)
        elif task[:21]=="decrease_servos_angle":
            adjustment=int(task[21:])
            change_servos_position(servos,adjustment)
        else:
            response = requests.post(f"{SERVER_URL}/execute", 
                        json={"gesture": task, "thumb_clearance": False},
                        timeout=1) 

    pass


def match_pattern(pattern_str, data_list_strs):
    # Convert the pattern string to a Python list
    pattern = ast.literal_eval(pattern_str)
    results = []

    for item_str in data_list_strs:
        lst = ast.literal_eval(item_str)  # Convert stored string to list
        if len(lst) != len(pattern):
            continue
        # Match each element
        match = all(p == "*" or p == v for p, v in zip(pattern, lst))
        if match:
            results.append(item_str)  # Keep original string form if you want
    return results

class GestureHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "API Server Running"}).encode())
        elif self.path == '/signals': #tested works
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
        elif self.path == '/mapping': #tested works
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
        start_time = time.time()
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        print(f"Received POST request on {self.path}")

        if self.path == '/add_signal': #testedworks
            signal_name = data['signal']
            signal_types=data["signal_types"]
            with open("signals.json", "r") as file:
                data = json.load(file)
            data[signal_name]=signal_types
            signal_mapping={}
            value_lists = list(data.values())
            combinations = itertools.product(*value_lists)
            results = [list(combo) for combo in combinations]
            for i in results:
                signal_mapping[str(i)]=None
            with open("mapping.json", "w") as file:
                json.dump(signal_mapping, file, indent=4) 
            with open("signals.json", "w") as file:
                json.dump(data, file, indent=4)
            end_time=time.time()
            print(f"Update request handled in {end_time-start_time:.2f} ms")
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
        elif self.path == '/remove_signal':
            signal_name = data['signal']
            with open("signals.json", "r") as file:
                data = json.load(file)
            del data[signal_name]
            signal_mapping={}
            value_lists = list(data.values())
            combinations = itertools.product(*value_lists)
            results = [list(combo) for combo in combinations]
            for i in results:
                signal_mapping[str(i)]=None
            with open("mapping.json", "w") as file:
                json.dump(signal_mapping, file, indent=4) 
            with open("signals.json", "w") as file:
                json.dump(data, file, indent=4)
            end_time=time.time()
            print(f"Update request handled in {end_time-start_time:.2f} ms")
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
        elif self.path == '/add_mapping':
            signal = data['signal']
            mapsto=data["mapsto"]
            with open("mapping.json", "r") as file:
                data = json.load(file)
            matches = match_pattern(signal,data.keys())
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
        elif self.path == '/receive_signals':
            signal = data['signal']
            value=data["value"]
            global signal_received,old_signal_received_time,signal_received_time
            if not signal_received:
                with open("signals.json", "r") as file:
                    data = json.load(file)
                for i in data:
                    signal_received[i]=None
                    old_signal_received_time[i]=100
            signal_received[signal]=value
            signal_received_time[signal]=time.time()
            proceed=True
            for key, value in signal_received.items():
                if value==None:
                    proceed=False
                    break
            for key in signal_received_time:
                if signal_received_time[key]-old_signal_received_time[key]<1:
                    proceed=False
                    break
            if proceed:
                convert_signal_to_action(signal_received)
                old_signal_received_time=copy.deepcopy(signal_received_time)
            end_time=time.time()
            print(f"Update request handled in {end_time-start_time:.2f} ms")
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()


import http.server
import socketserver

PORT = 7001  # Or any port you want

with socketserver.TCPServer(("", PORT), GestureHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nReceived Ctrl+C, shutting down")
        httpd.shutdown()
