import requests
from typing import Optional, Dict, Any

from services.constant_service import VALID_HTTP_METHODS


def build_url(url: str, variables: Dict[str, str]) -> str:
    """Replaces placeholders in the URL with actual variable values."""
    for key, value in variables.items():
        url = url.replace(f"${key}", value)
    return url


def call_api(
        method: str,
        url: str,
        variables: Dict[str, str] = {},
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        body: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Performs an HTTP request and returns a structured response."""

    method = method.upper()
    if method not in VALID_HTTP_METHODS:
        return {"error": f"Unsupported HTTP method: {method}"}

    request_func = getattr(requests, method.lower())

    full_url = build_url(url, variables)
    response = request_func(full_url, headers=headers, params=params, json=body)

    response_data = {
        "code": response.status_code,
        "content": response.text
    }

    when_data = {}
    if headers:
        when_data["header"] = headers
    if params:
        when_data["query"] = params
    if body:
        when_data["body"] = body
    if when_data:
        response_data["when"] = when_data

    return {
        "predicate": {
            "method": method,
            "path": url
        },
        "responses": [{"response": response_data}]
    }
