class BaseLlm:
    def generate(self, prompt: str) -> str:
        raise NotImplementedError("Subclasses must implement this method")
