from fastapi import APIRouter, HTTPException
from app.schemas.domain import Domain
from app.services.ollama_service import OllamaService
from json.decoder import JSONDecoder

router = APIRouter(prefix="/domains", tags=["domains"])
ollama = OllamaService()


@router.post("/api/v1/analyze")
async def analyze_domain(payload: Domain):
    try:
        domain = payload.domain
        if not domain:
            raise HTTPException(400, detail={"message": "domain name is required"})

        prompt = f"""
        You are an elite cyber threat intelligence analyst and expert in domain reputation analysis.

        CONTEXT:
        Analyze the following domain name: "{domain}"

        TASK:
        Evaluate the domain for potential malicious intent, phishing risk, brand impersonation, typosquatting, or suspicious structure. 

        CRITERIA FOR EVALUATION:
        - High Risk (Score 70-100): Clear indicators of typosquatting, look-alike branding, malicious keywords, or high-risk TLDs combined with deceptive strings.
        - Medium Risk (Score 31-69): Unusual structure, minor brand similarities, or generic keywords that could be used for phishing but lack definitive proof.
        - Low Risk (Score 0-30): Legitimate structure, standard corporate branding, or benign common words with no signs of deception.

        OUTPUT FORMAT:
        You must return a valid, clean, parsable JSON object. Do not include markdown code block formatting (like ```json), no trailing commas, and no conversational text before or after the JSON.

        REQUIRED JSON STRUCTURE:
        {{
            "risk": "high" | "medium" | "low",
            "score": <integer between 0 and 100>,
            "message": "<A concise, one-sentence warning summary for an end-user>",
            "reasons": [
                "<Specific analytical reason 1>",
                "<Specific analytical reason 2>"
                "<Specific analytical reason 3>"
            ]
        }}
        """

        data = ollama.generate(prompt)
        return JSONDecoder().decode(
            data,
        )
    except Exception as e:
        print(str(e))
        return HTTPException(500, detail={"message": "Internal server error"})
