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