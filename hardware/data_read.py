##################################################################
# script to read serial data from Arduino and store in a structure
##################################################################
import serial
import time
import requests

from pylsl import StreamInlet, resolve_byprop
import time
import requests

# Change to your Bluetooth COM port
ser = serial.Serial('COM9', 115200)
time.sleep(2)  # wait for Arduino reset

# glove thresholds for each of the 5 values
thresholds = [1700, 1700, 1500, 1200, 1800]


print("Looking for an EMG stream...")
streams = resolve_byprop('type', 'EMG')
inlet = StreamInlet(streams[0])
print("EMG stream found!")

# initialize time threshold and variables for storing time
time_thres_bicep = 500
time_thres_cheek = 1200
prev_time = 0
flex_thres = 0.3

# json values to send
mode = 0


# Local API endpoint
url = "http://127.0.0.1:7001/receive_signals"  # change to your API route
signals = ["finger1", "finger2", "finger3", "finger4", "finger5", "bicep", "mode"]
#signals = ["finger1", "finger2", "finger3", "finger4", "finger5"]
values = []

try:
    while True:
        data = [] #clear
        # Read each lines
        #Glove

        line = ser.readline().decode('utf-8').strip()
        if line:
            values = line.split(",")  # list of strings
            values = [int(v) for v in values]  # convert to ints

            # Compare with thresholds
            for i, val in enumerate(values):
                data.append(str(i + 1) + ("flexed" if val > thresholds[i] else "notflexed"))

        # #EMG
        inlet.pull_chunk(timeout=0.0)
        time.sleep(0.1)
        samples, timestamp = inlet.pull_sample()  # get EMG data sample and its timestamp

        curr_time = int(round(time.time() * 1000))  # get current time in milliseconds

        if ((samples[0] >= flex_thres) & (
                curr_time - time_thres_bicep > prev_time)):  # if an EMG spike is detected from the cheek muscles send 'G'
            prev_time = int(round(time.time() * 1000))  # update time
            data.append("true")
        else:
            data.append("false")

        if ((samples[2] >= flex_thres) & (
                curr_time - time_thres_cheek > prev_time)):  # if an EMG spike is detected from the eyebrow muscles send 'R'
            prev_time = int(round(time.time() * 1000))  # update time
            mode = (mode + 1) % 3

        data.append(str(mode))

        payload = {
            "signal": signals,
            "value": data
        }
        # Send JSON to local server
        try:
            response = requests.post(url, json=payload)
            print(f"Server response: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error sending data: {e}")

        ser.reset_input_buffer()

        time.sleep(0.5)
        #print(values)  # see values in console


# exit upon KeyboardInterrupt (Ctrl + C)
except KeyboardInterrupt:
    print("Stopped")
    ser.close()


