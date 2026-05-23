from pydantic import BaseModel, AnyUrl


class Domain(BaseModel):
    domain: AnyUrl
