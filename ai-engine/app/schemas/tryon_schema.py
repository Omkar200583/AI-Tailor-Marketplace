from pydantic import BaseModel


class TryOnResponse(BaseModel):
    result_url: str
    public_id: str
    disclaimer: str = (
        "हा फक्त अंदाजे Visual Preview आहे. प्रत्यक्ष फिटिंग किंवा अचूक मापाची हमी नाही. "
        "(This is an approximate visual preview, not a guarantee of fit or exact measurements.)"
    )
