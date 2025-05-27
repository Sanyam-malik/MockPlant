import json
import time
from flask import Response

from services.fallback_service import fallback_responses
from services.loading_service import imposters
from services.time_service import TimeConverterService
from services.utility_service import get_response_content_type, desanitize_content, apply_template, match_conditions, \
    parse_request_body, match_body_conditions, match_path_conditions, match_path, match_header_conditions


def get_forced_response(path_vars, forced_code, responses):
    for entry in responses:
        code = int(entry.response.code)
        if code == forced_code:
            response_content = apply_template(entry.response.content, path_vars)
            headers = entry.response.headers or {}
            content_type = entry.response.content_type
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
            match &= match_header_conditions(headers, when["header"])
        if match and "body" in when:
            match &= match_body_conditions(body, when["body"])
        if match and "path" in when:
            match &= match_path_conditions(path_vars, when["path"])

        if "files" in body and len(body['files']) > 0:
            path_vars['files'] = body['files']

        if match:
            # Apply dynamic templating for content
            response_content = apply_template(entry.response.content, path_vars)
            headers = entry.response.headers or {}
            content_type = get_response_content_type(entry.response.content_type)
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
