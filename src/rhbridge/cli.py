from __future__ import annotations
import argparse
from rich.console import Console
console = Console()
from .bridge.ronin_client import RoninClient
from pathlib import Path
import yaml

def main():
    parser = argparse.ArgumentParser(prog="rhbridge", description="RoninHand HRI Bridge CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    send = sub.add_parser("send", help="Send a gesture to RoninHand")
    send.add_argument("--gesture", required=True, help="Gesture name, e.g., 'fist'")
    send.add_argument("--thumb-clearance", action="store_true", help="Enable thumb clearance path")
    send.add_argument("--server", default=None, help="Override base URL, e.g., http://localhost:8000")
    send.add_argument("--config", default="config/local.yaml", help="Path to config file")

    args = parser.parse_args()

    cfg = {}
    cfg_path = Path(args.config)
    if cfg_path.exists():
        cfg = yaml.safe_load(cfg_path.read_text()) or {}
    base_url = args.server or cfg.get("server", {}).get("base_url", "http://localhost:8000")

    client = RoninClient(base_url=base_url)
    ok = client.execute(gesture=args.gesture, thumb_clearance=args.thumb_clearance)
    if ok:
        console.print(f":white_check_mark: Sent gesture '{args.gesture}' to {base_url}")
    else:
        console.print(f":warning: Failed to send gesture '{args.gesture}' to {base_url}", style="bold red")

if __name__ == "__main__":
    main()
