"""
tlmviewer Python helper — push scenes to a running tlmserver.
"""

import json
import urllib.request
import urllib.error
from typing import Any

PROTOCOL_VERSION = 1


def push_scene(
    scene: dict[str, Any],
    *,
    host: str = "127.0.0.1",
    port: int = 8765,
    topic: str = "main",
    mode: str = "latest",
) -> None:
    """Push a scene dict to a running tlmserver.

    Args:
        scene:  Scene payload (dict with a "data" key containing element list).
        host:   tlmserver host (default: 127.0.0.1).
        port:   tlmserver port (default: 8765).
        topic:  Topic name (default: "main").
        mode:   "latest" (replace) or "append" (ring buffer).

    Raises:
        ConnectionRefusedError: Server is not reachable.
        ValueError: Server rejected the envelope (bad version, missing fields, etc.).
        RuntimeError: Unexpected HTTP error from the server.
    """
    envelope = {
        "v": PROTOCOL_VERSION,
        "type": "scene",
        "topic": topic,
        "mode": mode,
        "payload": scene,
    }

    body = json.dumps(envelope).encode()
    url = f"http://{host}:{port}/push"
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            if not result.get("ok"):
                raise RuntimeError(f"tlmserver returned unexpected response: {result}")
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read()).get("error", e.reason)
        except Exception:
            detail = e.reason
        raise ValueError(f"tlmserver rejected the push (HTTP {e.code}): {detail}") from e
    except urllib.error.URLError as e:
        raise ConnectionRefusedError(
            f"Could not connect to tlmserver at {url}: {e.reason}"
        ) from e
