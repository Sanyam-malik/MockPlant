import base64
import html
import json
import yaml


def yaml_to_json(yaml_str: str) -> str:
    """Converts a YAML string to a formatted JSON string."""
    data = yaml.safe_load(yaml_str)
    return json.dumps(data, indent=2)

def json_to_yaml(json_str: str) -> str:
    """Converts a JSON string to a YAML string."""
    data = json.loads(json_str)
    return yaml.dump(data, sort_keys=False, indent=2)


def get_response_content_type(content_type: str) -> str:
    """Get the appropriate content type for the response"""
    content_type = content_type.lower()

    # Map common content types
    content_type_map = {
        'json': 'application/json',
        'xml': 'application/xml',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'javascript': 'application/javascript',
        'text': 'text/plain',
        'binary': 'application/octet-stream'
    }

    # Check if the content type is already a full MIME type
    if '/' in content_type:
        return content_type

    # Return mapped content type or default to text/plain
    return content_type_map.get(content_type, 'text/plain')

def get_content_type_headers(content_type):
    """Get appropriate headers based on content type"""
    headers = {}
    if content_type:
        headers['Content-Type'] = get_response_content_type(content_type)
    return headers


def sanitize_content(content, content_type):
    if not content:
        return content
    else:
        content_type = get_response_content_type(content_type)

    if content_type in ['text/html', 'application/xml', 'text/html']:
        # HTML encode the content to prevent rendering
        return html.escape(content)
    elif content_type == 'application/javascript':
        # Encode JavaScript content
        return f"{html.escape(content)}"
    elif content_type == 'text/css':
        # Encode CSS content
        return f"{html.escape(content)}"
    elif content_type == 'application/octet-stream':
        # For binary content, show as base64
        try:
            return f"{html.escape(base64.b64encode(content.encode('utf-8')).decode('utf-8'))}"
        except:
            return "Binary content (unable to encode)"
    return content

def desanitize_content(content, content_type):
    if not content:
        return content
    else:
        content_type = get_response_content_type(content_type)

    if content_type in ['text/html', 'application/xml', 'text/html']:
        # Unescape HTML entities
        return html.unescape(content)
    elif content_type == 'application/javascript':
        # JavaScript was HTML escaped – unescape it
        return html.unescape(content)
    elif content_type == 'text/css':
        # CSS was HTML escaped – unescape it
        return html.unescape(content)
    elif content_type == 'application/octet-stream':
        # Assume base64 encoded string; try to decode
        try:
            return base64.b64decode(html.unescape(content)).decode('utf-8')
        except Exception:
            return "Binary content (unable to decode)"
    return content