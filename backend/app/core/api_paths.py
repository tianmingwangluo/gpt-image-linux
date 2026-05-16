from typing import Any

from . import settings as config

DEFAULT_API_PATH = "/v1/images/generations"
RESPONSES_API_PATH = "/v1/responses"
CHAT_COMPLETIONS_API_PATH = "/v1/chat/completions"
ALLOWED_API_PATHS = {DEFAULT_API_PATH, RESPONSES_API_PATH, CHAT_COMPLETIONS_API_PATH}


def normalize_api_path(api_path: str | None) -> str:
    value = str(api_path or config.DEFAULT_API_PATH or DEFAULT_API_PATH)
    return value if value in ALLOWED_API_PATHS else DEFAULT_API_PATH


def build_upstream_url(api_url: str, api_path: str) -> str:
    base_url = str(api_url or "").rstrip("/")
    path = "/" + str(api_path or "").lstrip("/")

    if base_url.endswith(path):
        return base_url
    if base_url.endswith("/v1") and path.startswith("/v1/"):
        return f"{base_url}{path[3:]}"
    return f"{base_url}{path}"


def normalize_api_preset(raw: dict[str, Any] | None, fallback_id: str = "default") -> dict[str, str]:
    preset = raw if isinstance(raw, dict) else {}
    preset_id = str(preset.get("id") or fallback_id)
    return {
        "id": preset_id,
        "name": str(preset.get("name") or "Untitled preset").strip() or "Untitled preset",
        "api_url": str(preset.get("api_url") or "").rstrip("/"),
        "api_key": str(preset.get("api_key") or "").strip(),
        "api_path": normalize_api_path(str(preset.get("api_path") or config.DEFAULT_API_PATH)),
    }
