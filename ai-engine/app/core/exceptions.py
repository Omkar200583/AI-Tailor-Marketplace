class AIEngineError(Exception):
    status_code = 500
    code = "ai_engine_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BadInputError(AIEngineError):
    status_code = 400
    code = "bad_input"


class UpstreamError(AIEngineError):
    status_code = 502
    code = "upstream_error"


class ConfigError(AIEngineError):
    status_code = 503
    code = "not_configured"
