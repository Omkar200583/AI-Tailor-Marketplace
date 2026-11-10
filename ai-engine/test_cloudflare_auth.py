import json
import urllib.request
import urllib.error

from app.core.config import get_settings

settings = get_settings()

url = "https://api.cloudflare.com/client/v4/user/tokens/verify"

request = urllib.request.Request(
    url,
    headers={
        "Authorization": f"Bearer {settings.cloudflare_api_token}",
        "Content-Type": "application/json"
    },
    method="GET"
)

try:
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.loads(response.read().decode())
        print("HTTP Status:", response.status)
        print("Token verification:", result.get("result", {}).get("status"))
        print("Success:", result.get("success"))

except urllib.error.HTTPError as error:
    print("HTTP Status:", error.code)
    print("Authentication response:", error.read().decode())

except Exception as error:
    print("Error:", str(error))
