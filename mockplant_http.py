from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from api.routes import api_bp
from services.constant_service import HTTP_PORT

import platform
import multiprocessing
import subprocess
import sys
import os

load_dotenv()
app = Flask(__name__)
CORS(app)
# Register the API blueprint
app.register_blueprint(api_bp)

def get_thread_count():
    """Calculate the number of threads based on CPU cores"""
    return (multiprocessing.cpu_count() * 4) + 1

def run_server():
    system = platform.system().lower()
    system = "windows"
    
    if system == 'linux':
        # Use Gunicorn for Linux
        threads = get_thread_count()
        # Get the absolute path to the current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Add the current directory to PYTHONPATH
        os.environ['PYTHONPATH'] = current_dir
        
        cmd = [
            'gunicorn',
            '--bind', f'0.0.0.0:{HTTP_PORT}',
            '--threads', str(threads),  # Multiple threads
            '--worker-class', 'gthread',
            '--timeout', '120',
            'mockplant_http:app'
        ]
        subprocess.run(cmd)
    elif system == 'windows':
        # Use Waitress for Windows
        from waitress import serve
        serve(app, host='0.0.0.0', port=HTTP_PORT, threads=16)
    else:
        print(f"Unsupported operating system: {system}")
        sys.exit(1)

if __name__ == '__main__':
    run_server()
