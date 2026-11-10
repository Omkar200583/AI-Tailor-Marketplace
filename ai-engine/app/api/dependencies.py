from fastapi import Depends

from app.core.security import verify_api_key

protected = [Depends(verify_api_key)]
