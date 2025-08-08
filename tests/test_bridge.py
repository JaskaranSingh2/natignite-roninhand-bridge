from rhbridge.bridge.ronin_client import RoninClient

def test_execute_monkeypatch(monkeypatch):
    class FakeResp:
        ok = True
    def fake_post(url, json=None, timeout=2.0):
        assert url.endswith("/execute")
        assert "gesture" in json
        return FakeResp()
    import requests
    monkeypatch.setattr(requests, "post", fake_post)
    c = RoninClient(base_url="http://x")
    assert c.execute("fist") is True
