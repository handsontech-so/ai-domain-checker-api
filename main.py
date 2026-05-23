from app.services.ollama_service import OllamaService


def main():
    print("Hello from ai-domain-checker-api!")
    ollama = OllamaService()
    print(ollama.generate("Hi iam ai-domain-checker-api"))


if __name__ == "__main__":
    main()
