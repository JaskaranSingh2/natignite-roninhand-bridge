import time
import numpy as np
from rhbridge.intents.emg_trigger import EMGTrigger, EMGTriggerConfig
from rhbridge.bridge.ronin_client import RoninClient

fs = 1000.0  # demo sampling rate
cfg = EMGTriggerConfig(window_ms=100, threshold=0.1, refractory_ms=300)
trigger = EMGTrigger(cfg)
client = RoninClient()

print("Simulating EMG stream... Press Ctrl+C to exit.")
t0 = time.time()
np.random.seed(0)
try:
    while True:
        now = time.time()
        # Fake EMG with occasional bursts
        noise = 0.05 * np.random.randn(100)
        burst = 0.0
        if np.random.rand() < 0.05:
            burst = 0.4 * np.random.randn(100)
        x = noise + burst
        fired = trigger.process(x, fs, now)
        if fired:
            print("Trigger -> fist")
            client.execute("fist")
        time.sleep(0.1)
except KeyboardInterrupt:
    pass
