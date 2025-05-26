import json
import re
import time
from string import Template
from flask import Response
from typing import Any

from services.fallback_service import fallback_responses
from services.loading_service import imposters
from services.time_service import TimeConverterService
from services.utility_service import get_response_content_type, desanitize_content


def match_conditions(source: dict, condition: dict) -> bool:
    if not isinstance(condition, dict):
        print(f"Expected a dictionary but got {type(condition)}: {condition}")
        return False
    """ Match a dictionary (`query`, `header`) against `when` conditions. """
    for key, expected in condition.items():
        actual = source.get(key)
        if expected == "*":
            if actual is None or actual == "":
                return False
        elif actual != expected:
            return False
    return True

def match_body_conditions(body: Any, condition: dict) -> bool:
    """Match body conditions with special handling for raw text bodies."""
    if not isinstance(condition, dict):
        print(f"Expected a dictionary but got {type(condition)}: {condition}")
        return False

    # If body is a dictionary (JSON), use regular matching
    if isinstance(body, dict):
        return match_conditions(body, condition)

    # For non-dict bodies (raw text, XML, etc.)
    body_str = str(body)
    for key, expected in condition.items():
        if key == "search":
            # Search for text within the body
            if expected not in body_str:
                return False
        elif key == "compare":
            # Compare entire body with expected text
            if body_str != expected:
                return False
        else:
            # For other keys, treat as regular matching
            if expected == "*":
                if not body_str:
                    return False
            elif body_str != expected:
                return False
    return True

def match_path(pattern, actual_path):
    """
    Match a path pattern with $variable-style variables, e.g., /users/$id.
    Returns a tuple: (matched: bool, variables: dict)
    """
    # Convert $var to named regex group (?P<var>[^/]+)
    pattern_regex = re.sub(r"\$(\w+)", r"(?P<\1>[^/]+)", pattern)
    pattern_regex = f"^{pattern_regex}$"

    match = re.match(pattern_regex, actual_path)
    return (True, match.groupdict()) if match else (False, {})

def apply_template(content, variables):
    """ Substitute path variables in the response content string using Python's string.Template. """
    template = Template(content)
    return template.safe_substitute(variables)

def get_forced_response(path_vars, forced_code, responses):
    for entry in responses:
        code = int(entry.response.code)
        if code == forced_code:
            response_content = Template(entry.response.content).safe_substitute(path_vars)
            headers = entry.response.headers or {}
            content_type = entry.response.content_type
            response_content = desanitize_content(response_content, content_type)
            return Response(
                response=desanitize_content(response_content, content_type),
                status=code,
                content_type=content_type,
                headers=headers
            )

    response = fallback_responses.get(forced_code)
    return Response(
        response=json.dumps(response, indent=2) if isinstance(response, dict) else response,
        status=forced_code,
        content_type='application/json'
    )

def parse_request_body(request_data):
    """Parse request body based on content type"""
    content_type = request_data.headers.get('Content-Type', '').lower()
    
    # Handle form data
    if 'multipart/form-data' in content_type:
        return request_data.form.to_dict()
    
    # Handle URL-encoded form data
    elif 'application/x-www-form-urlencoded' in content_type:
        return request_data.form.to_dict()
    
    # Handle JSON
    elif 'application/json' in content_type:
        try:
            return request_data.get_json(force=True, silent=True) or {}
        except:
            return {}
    
    # Handle XML
    elif 'application/xml' in content_type or 'text/xml' in content_type:
        return request_data.get_data(as_text=True)
    
    # Handle HTML
    elif 'text/html' in content_type:
        return request_data.get_data(as_text=True)
    
    # Handle CSS
    elif 'text/css' in content_type:
        return request_data.get_data(as_text=True)
    
    # Handle JavaScript
    elif 'application/javascript' in content_type or 'text/javascript' in content_type:
        return request_data.get_data(as_text=True)
    
    # Handle raw text
    elif 'text/plain' in content_type:
        return request_data.get_data(as_text=True)
    
    # Handle binary data
    elif 'application/octet-stream' in content_type:
        return request_data.get_data()
    
    # Default to empty dict
    return {}

def get_dynamic_response(request_data, path_vars, responses):
    headers = dict(request_data.headers)
    query = request_data.args.to_dict()
    body = parse_request_body(request_data)

    for entry in responses:
        when = entry.when
        match = True

        if "query" in when:
            match &= match_conditions(query, when["query"])
        if match and "header" in when:
            match &= match_conditions(headers, {key.title(): value for key, value in when["header"].items()})
        if match and "body" in when:
            match &= match_body_conditions(body, when["body"])
        if match and "path" in when:
            match &= match_conditions(path_vars, {key: str(value) for key, value in when["path"].items()})

        if match:
            # Apply dynamic templating for content
            response_content = Template(entry.response.content).safe_substitute(path_vars)
            headers = entry.response.headers or {}
            content_type = get_response_content_type(entry.response.content_type)
            response_content = desanitize_content(response_content, content_type)
            return Response(
                response=desanitize_content(response_content, content_type),
                status=int(entry.response.code),
                content_type=content_type,
                headers=headers
            )

    response = fallback_responses.get(200)
    return Response(
        response=json.dumps(response, indent=2) if isinstance(response, dict) else response,
        status=200,
        content_type='application/json'
    )


def handle_request(path, request_data, imposter_type="HTTP"):
    """ Handle incoming requests, match them with imposters, and return appropriate responses. """
    req_method = request_data.method
    req_path = f"/{path}"
    delay = None
    response = None

    # Use the globally imported `imposters` list
    for imposter in imposters:
        if imposter.imposter.type != imposter_type:
            continue

        for predicate in imposter.predicates:
            if predicate.method != req_method:
                continue

            # Path matching with dynamic variables
            path_match, path_vars = match_path(predicate.path, req_path)
            if not path_match:
                continue

            delay = predicate.delay

            if predicate.force_response:
                response = get_forced_response(path_vars, int(predicate.force_response), predicate.responses)
                return response
            else:
                response = get_dynamic_response(request_data, path_vars, predicate.responses)
                return response

    if delay:
        time.sleep(TimeConverterService.to_seconds(delay))

    if response:
        return response
    return Response(
        response=json.dumps({"error": "No matching imposter found"}),
        status=404,
        content_type='application/json'
    )
