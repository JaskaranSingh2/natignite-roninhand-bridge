import requests
import json
import itertools
def check():
    SERVER_URL="http://localhost:7001"
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"finger1","signal_types":["1flexed","1notflexed"]}, timeout=3)
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"finger2","signal_types":["2flexed","2notflexed"]}, timeout=3)
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"finger3","signal_types":["3flexed","3notflexed"]}, timeout=3)
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"finger4","signal_types":["4flexed","4notflexed"]}, timeout=3)
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"finger5","signal_types":["5flexed","5notflexed"]}, timeout=3)
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"bicep","signal_types":["true","false"]}, timeout=3)
    response = requests.post(f"{SERVER_URL}/add_signal",json={"signal":"mode","signal_types":["0","1","2"]}, timeout=3)
check()