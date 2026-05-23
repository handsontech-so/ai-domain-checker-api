from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "your-api-key")
