from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "your-api-key")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:120b")
