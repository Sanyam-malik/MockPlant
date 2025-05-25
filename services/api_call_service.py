import requests
from typing import Optional, Dict, Any, Union
from requests.structures import CaseInsensitiveDict

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
        body: Optional[Union[Dict[str, Any], str, bytes]] = None,
        body_type: Optional[str] = None
) -> Dict[str, Any]:
    """Performs an HTTP request and returns a structured response."""

    method = method.upper()
    if method not in VALID_HTTP_METHODS:
        return {"error": f"Unsupported HTTP method: {method}"}

    request_func = getattr(requests, method.lower())
    full_url = build_url(url, variables)

    # Convert headers to CaseInsensitiveDict for consistent handling
    headers = CaseInsensitiveDict(headers) if headers else CaseInsensitiveDict()

    # Prepare request kwargs
    request_kwargs = {
        'headers': headers,
        'params': params
    }

    # Handle different body types
    if body is not None and method in ['POST', 'PUT', 'PATCH']:
        content_type = headers.get('Content-Type', '').lower()
        
        if body_type == 'form-data':
            # Handle form-data
            files = {}
            data = {}
            for key, value in body.items():
                if isinstance(value, (str, bytes)):
                    data[key] = value
                else:
                    files[key] = value
            request_kwargs['files'] = files
            request_kwargs['data'] = data
        elif body_type == 'x-www-form-urlencoded':
            # Handle x-www-form-urlencoded
            request_kwargs['data'] = body
        elif body_type == 'raw':
            # Handle raw body
            request_kwargs['data'] = body
        elif body_type == 'binary':
            # Handle binary data
            request_kwargs['data'] = body
        elif body_type == 'graphql':
            # Handle GraphQL
            request_kwargs['json'] = body
        else:
            # Default to JSON
            request_kwargs['json'] = body

    response = request_func(full_url, **request_kwargs)

    response_data = {
        "code": response.status_code,
        "content": response.text
    }

    when_data = {}
    if headers:
        when_data["header"] = dict(headers)
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
