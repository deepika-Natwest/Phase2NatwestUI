import json
import threading
from pathlib import Path
from typing import Any

# Serialises all JSON reads and writes within this process so concurrent
# requests cannot interleave their file I/O and corrupt data.
_lock = threading.Lock()


def read_json(file_path: Path) -> Any:
    with _lock:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []


def write_json(file_path: Path, data: Any) -> None:
    """Write JSON under the global lock so no two writes can interleave.
    Direct write (no temp-file rename) avoids os.replace PermissionError on
    Windows when another process briefly holds the file open."""
    with _lock:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
