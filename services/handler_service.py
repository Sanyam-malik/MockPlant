import json
import re
import time
from string import Template

from services.fallback_service import fallback_responses
from services.loading_service import imposters
from services.time_service import TimeConverterService


def match_conditions(source: dict, condition: dict) -> bool:
    if not isinstance(condition, dict):
        print(f"Expected a dictionary but got {type(condition)}: {condition}")
        return False
    """ Match a dictionary (`query`, `header`, `body`) against `when` conditions. """
    for key, expected in condition.items():
        actual = source.get(key)
        if expected == "*":
            if actual is None or actual == "":
                return False
        elif actual != expected:
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
            return response_content, code

    return fallback_responses.get(forced_code), forced_code

def get_dynamic_response(request_data, path_vars, responses):
    headers = dict(request_data.headers)
    query = request_data.args.to_dict()

    # Parse body as JSON (if any)
    try:
        body_json = request_data.get_json(force=True, silent=True) or {}
    except:
        body_json = {}

    for entry in responses:
        when = entry.when
        match = True

        if "query" in when:
            match &= match_conditions(query, when["query"])
        if match and "header" in when:
            match &= match_conditions(headers, {key.title(): value for key, value in when["header"].items()})
        if match and "body" in when:
            match &= match_conditions(body_json, when["body"])
        if match and "path" in when:
            match &= match_conditions(path_vars, {key: str(value) for key, value in when["path"].items()})

        if match:
            # Apply dynamic templating for content
            response_content = Template(entry.response.content).safe_substitute(path_vars)
            return response_content, int(entry.response.code)

    return fallback_responses.get(200), 200


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
            else:
                response = get_dynamic_response(request_data, path_vars, predicate.responses)

    if delay:
        time.sleep(TimeConverterService.to_seconds(delay))

    if response:
        return response
    return json.dumps({"error": "No matching imposter found"}), 404
