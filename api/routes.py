import json

from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, render_template
from dataclasses import asdict

from services.api_call_service import call_api
from services.constant_service import AUTO_CREATE_TESTS
from services.loading_service import load_yaml_imposters, add_yaml_imposter, list_yaml_imposters, parse_imposter_yaml, \
    imposters, save_imposter, delete_imposter, reload_imposters
from services.handler_service import handle_request
from services.tests_generator_service import generate_tests, get_tests
from services.tests_runner_service import TestRunnerService
from services.utility_service import json_to_yaml
from entity.imposter_model import Imposter, Predicate, ResponseEntry, Response

api_bp = Blueprint('api', __name__)

# Load imposters from files when the app starts
load_yaml_imposters()

def _generate_tests():
    if AUTO_CREATE_TESTS:
        generate_tests()

@api_bp.route("/")
def index():
    return render_template("index.html")

# API Route to add a new imposter
@api_bp.route('/_imposters', methods=['POST'])
def add_imposter_route():
    data = request.get_json()
    data["imposter"]["file"] = f"imp{len(imposters)+1}.yaml"
    imposter = parse_imposter_yaml(data)
    add_yaml_imposter(data)
    if save_imposter(imposter):
        reload_imposters()
        _generate_tests()
    return jsonify({"message": "Imposter Added"}), 201

# API Route to list all imposters
@api_bp.route('/_imposters', methods=['GET'])
def list_imposters_route():
    return jsonify(list_yaml_imposters())

# API Route to update an imposter
@api_bp.route('/_imposters/<int:index>', methods=['PUT'])
def update_imposter_route(index):
    data = request.get_json()
    try:
        imposters[index] = parse_imposter_yaml(data)
        if save_imposter(imposters[index]):
            reload_imposters()
            _generate_tests()
        return jsonify({"message": "Imposter Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Route to update an imposter
@api_bp.route('/_imposters/<int:index>', methods=['DELETE'])
def delete_imposter_route(index):
    try:
        if delete_imposter(imposters[index]):
            reload_imposters()
            _generate_tests()
        return jsonify({"message": "Imposter Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Route to run tests for imposters
@api_bp.route('/_tests', methods=['GET'])
def test_imposters():
    response = {
        "tests": TestRunnerService().run_tests(),
        "cases": get_tests()
    }
    return jsonify(response)

@api_bp.route('/_record', methods=['POST'])
def record():
    data = request.get_json()

    method = data.get('method')
    url = data.get('url')
    variables = data.get('variables', {})
    headers = data.get('headers', {})
    params = data.get('params')
    body = data.get('body')
    body_type = data.get('body_type', 'json')  # Default to JSON if not specified

    if not method or not url:
        return jsonify({"error": "Both 'method' and 'url' are required."}), 400

    # Make the API call and get the response
    result = call_api(method, url, variables, headers, params, body, body_type)
    
    # Convert the result to YAML format
    yaml_result = json_to_yaml(json.dumps(result, indent=2))
    
    return yaml_result, 200

# General route to handle requests, using the service for matching
@api_bp.route('/', defaults={'path': ''}, methods=["GET", "POST", "PUT", "DELETE"])
@api_bp.route('/<path:path>', methods=["GET", "POST", "PUT", "DELETE"])
def handle_request_route(path):
    return handle_request(path, request)
