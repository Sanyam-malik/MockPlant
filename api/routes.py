import json

from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, render_template

from services.api_call_service import call_api
from services.constant_service import AUTO_CREATE_TESTS
from services.loading_service import load_yaml_imposters, add_yaml_imposter, list_yaml_imposters, parse_imposter_yaml, \
    imposters
from services.handler_service import handle_request
from services.tests_generator_service import generate_tests, get_tests
from services.tests_runner_service import TestRunnerService
from services.utility_service import json_to_yaml

api_bp = Blueprint('api', __name__)

# Load imposters from files when the app starts
load_yaml_imposters()

if AUTO_CREATE_TESTS:
    generate_tests()

@api_bp.route("/")
def index():
    return render_template("index.html")

# API Route to add a new imposter
@api_bp.route('/_imposters', methods=['POST'])
def add_imposter_route():
    data = request.get_json()
    add_yaml_imposter(data)
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
        return jsonify({"message": "Imposter Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# API Route to run tests for imposters
@api_bp.route('/_tests', methods=['GET'])
def test_imposters():
    results = TestRunnerService().run_tests()
    return jsonify(results)

# API Route to run tests for imposters
@api_bp.route('/_tests/cases', methods=['GET'])
def test_case_imposters():
    return jsonify(get_tests())

@api_bp.route('/_record', methods=['POST'])
def record():
    data = request.get_json()

    method = data.get('method')
    url = data.get('url')
    variables = data.get('variables', {})
    headers = data.get('headers')
    params = data.get('params')
    body = data.get('body')

    if not method or not url:
        return jsonify({"error": "Both 'method' and 'url' are required."}), 400

    result = json.dumps(call_api(method, url, variables, headers, params, body), indent=2)

    return json_to_yaml(result), 200

# General route to handle requests, using the service for matching
@api_bp.route('/', defaults={'path': ''}, methods=["GET", "POST", "PUT", "DELETE"])
@api_bp.route('/<path:path>', methods=["GET", "POST", "PUT", "DELETE"])
def handle_request_route(path):
    return handle_request(path, request)
