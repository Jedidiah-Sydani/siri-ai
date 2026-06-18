import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
ROOT_ENV_PATH = ROOT_DIR / ".env"


def load_root_env(env_path: Path = ROOT_ENV_PATH) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if key.startswith("export "):
            key = key.removeprefix("export ").strip()
        if not key or key in os.environ:
            continue

        value = value.strip().strip("\"'")
        os.environ[key] = value
