from app.core.base_llm import BaseLlm
from app.core.config import OLLAMA_API_KEY, OLLAMA_MODEL
from ollama import Client


class OllamaService(BaseLlm):
    def __init__(self):
        self.client = Client(
            host="https://ollama.com",
            headers={"Authorization": f"Bearer {OLLAMA_API_KEY}"},
        )
        self.model = OLLAMA_MODEL

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                options={"temperature": 0.2},
            )

            return response.message.content or "Sorry, try again."
        except Exception as e:
            print(e)
            return "Sorry, try again."
