import os
import json
import re

from services.constant_service import BASE_URL, TESTS_FILE
from services.fallback_service import fallback_responses
from services.loading_service import imposters


def substitute_path_variables(path, path_vars=None):
    if path_vars:
        for key, value in path_vars.items():
            path = path.replace(str("$"+key), str(value))
    """Convert $param-style variables to test values (e.g., $id → 123)."""
    return re.sub(r'\$(\w+)', lambda m: "123", path)

def extract_path_params(path, path_vars=None):
    """Extract $param variables from path and map them to test values like {'id': '123'}."""
    vars_dict = {match[1:]: "123" for match in re.findall(r"\$\w+", path)}
    if path_vars:
        for key, value in path_vars.items():
            vars_dict[key] = str(value)
    return vars_dict

def build_url(path, imposter_type, path_vars=None, query=None):
    base = f"{BASE_URL[imposter_type]}{substitute_path_variables(path, path_vars)}"
    if query:
        q = "&".join(f"{k}={v}" for k, v in query.items())
        return f"{base}?{q}"
    return base

def collect_test_cases():
    test_cases = []

    for imposter in imposters:

        imposter_name = imposter.imposter.name
        imposter_type = imposter.imposter.type

        for predicate in imposter.predicates:

            if predicate.force_response is not None:
                forced_test = create_tests_for_forced_responses(imposter_name, imposter_type, predicate, predicate.force_response)
                test_cases.extend(forced_test)
            else:
                dynamic_tests = create_tests_for_dynamic_responses(imposter_name, imposter_type, predicate)
                test_cases.extend(dynamic_tests)

    return test_cases

def create_tests_for_forced_responses(imposter_name, imposter_type, predicate, force_response):
    test_cases = []
    method = predicate.method
    path = predicate.path
    test_index=0

    for resp in predicate.responses:
        when = resp.when
        response = resp.response
        code = int(response.code)

        if code != force_response:
            continue

        path_vars = extract_path_params(path, when.get("path"))
        # Replace all $params in expected content
        expected_text = response.content
        for var, val in path_vars.items():
            expected_text = expected_text.replace(f"${var}", val)

        test_case = {
            "imposter": imposter_type,
            "name": f"test_{test_index}_{imposter_name}",
            "method": method,
            "path": path,
            "url": build_url(path, imposter_type, when.get("path"), when.get("query")),
            "headers": when.get("header", {}),
            "body": when.get("body", {}),
            "expected_code": code,
            "expected_text": expected_text
        }
        test_cases.append(test_case)
        test_index += 1

    if len(test_cases) == 0:
        test_case = {
            "imposter": imposter_type,
            "name": f"test_{test_index}_{imposter_name}",
            "method": method,
            "path": path,
            "url": build_url(path, imposter_type),
            "headers": {},
            "body": {},
            "expected_code": force_response,
            "expected_text": fallback_responses.get(force_response)
        }
        test_cases.append(test_case)
        test_index += 1
    return test_cases

def create_tests_for_dynamic_responses(imposter_name, imposter_type, predicate):
    test_cases = []
    method = predicate.method
    path = predicate.path
    test_index = 0

    for resp in predicate.responses:
        when = resp.when
        response = resp.response
        code = int(response.code)

        path_vars = extract_path_params(path, when.get("path"))
        # Replace all $params in expected content
        expected_text = response.content
        for var, val in path_vars.items():
            expected_text = expected_text.replace(f"${var}", val)

        test_case = {
            "imposter": imposter_type,
            "name": f"test_{test_index}_{imposter_name}",
            "method": method,
            "path": path,
            "url": build_url(path, imposter_type, when.get("path"), when.get("query")),
            "headers": when.get("header", {}),
            "body": when.get("body", {}),
            "expected_code": code,
            "expected_text": expected_text
        }
        test_cases.append(test_case)
        test_index += 1
    return test_cases

def generate_tests():
    cases = collect_test_cases()
    output_file = os.path.join(TESTS_FILE)
    with open(output_file, "w") as f:
        json.dump(cases, f, indent=2)
    print(f"✅ Generated {len(cases)} test cases to {output_file}")
    return cases

def get_tests():
    output_file = os.path.join(TESTS_FILE)
    if not os.path.exists(output_file):
        with open(output_file, "w") as f:
            json.dump({}, f, indent=2)
    with open(output_file, "r") as f:
        return json.load(f)

if __name__ == "__main__":
    generate_tests()