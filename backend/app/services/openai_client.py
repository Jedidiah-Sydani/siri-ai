from typing import Any

import httpx
from fastapi import HTTPException


OPENAI_DEFAULT_MODEL = "gpt-4o-mini"
OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1"
OPENAI_TIMEOUT = 30


class OpenAIChatClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
    ) -> None:
        import os

        self.api_key = api_key if api_key is not None else os.getenv("OPENAI_API_KEY", "").strip()
        self.model = OPENAI_DEFAULT_MODEL
        self.base_url = OPENAI_DEFAULT_BASE_URL

    async def chat_completion(
        self,
        *,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        response_format: dict[str, str] | None = None,
    ) -> str:
        if not self.api_key:
            raise HTTPException(status_code=503, detail="OpenAI chat completion requires OPENAI_API_KEY.")

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            async with httpx.AsyncClient(timeout=OPENAI_TIMEOUT) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"OpenAI returned status {exc.response.status_code}.",
            ) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach OpenAI.") from exc

        choices = response.json().get("choices", [])
        content = (
            choices[0]
            .get("message", {})
            .get("content", "")
            if choices
            else ""
        )
        if not content.strip():
            raise HTTPException(status_code=502, detail="OpenAI returned an empty response.")
        return content.strip()


def get_openai_chat_client() -> OpenAIChatClient:
    return OpenAIChatClient()
