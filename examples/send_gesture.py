from rhbridge.bridge.ronin_client import RoninClient
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--gesture", required=True)
parser.add_argument("--server", default="http://localhost:8000")
args = parser.parse_args()

client = RoninClient(base_url=args.server)
ok = client.execute(args.gesture)
print("OK" if ok else "FAIL")
