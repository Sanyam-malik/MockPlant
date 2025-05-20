import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from api.routes import api_bp
from services.constant_service import HTTP_PORT, AUTO_CREATE_TESTS
from services.tests_generator_service import generate_tests

load_dotenv()
app = Flask(__name__)
CORS(app)
# Register the API blueprint
app.register_blueprint(api_bp)

if __name__ == '__main__':
    app.run(port=HTTP_PORT)
