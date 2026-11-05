
import httpx

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"


async def generate_response(prompt: str) -> str:
    """
    Generate a response using the local Ollama model.
    Allows extra time for large prompts and slower local generation.
    """

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "keep_alive": "10m",
    }

    timeout = httpx.Timeout(
        connect=15.0,
        read=600.0,
        write=60.0,
        pool=15.0,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            OLLAMA_URL,
            json=payload,
        )

        response.raise_for_status()

        data = response.json()

        generated_text = data.get("response", "")

        if not generated_text.strip():
            raise ValueError("Ollama returned an empty response.")

        return generated_text
