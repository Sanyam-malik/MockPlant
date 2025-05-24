import os
from dataclasses import is_dataclass, asdict

import yaml
from typing import List, Dict, Any

from services.constant_service import IMPOSTERS_FOLDER

# Import the dataclasses
from entity.imposter_model import Imposter, ImposterMetadata, ResponseEntry, Predicate, Response

imposters: List[Imposter] = []

class YamlDumper(yaml.Dumper):

    def increase_indent(self, flow=False, indentless=False):
        return super(YamlDumper, self).increase_indent(flow, False)

def parse_imposter_yaml(data: Dict[str, Any]) -> Imposter:
    """Parse a YAML dictionary into an Imposter object."""
    # Use the ImposterMetadata dataclass for metadata
    metadata = ImposterMetadata(**data["imposter"])

    predicates = []
    for pred_obj in data["predicates"]:
        pred_data = pred_obj.get("predicate", pred_obj)
        responses = [
            ResponseEntry(
                response=Response(**resp.get('response')),
                when=resp.get("when", {})
            ) for resp in pred_obj.get("responses", [])
        ]

        predicate = Predicate(
            method=pred_data["method"],
            path=pred_data["path"],
            delay=pred_data.get("delay"),
            force_response=pred_data.get("force_response"),
            responses=responses
        )
        predicates.append(predicate)

    return Imposter(imposter=metadata, predicates=predicates)


def save_imposter(data: Imposter):
    if not os.path.exists(IMPOSTERS_FOLDER):
        os.makedirs(IMPOSTERS_FOLDER)
    filename = data.imposter.file
    if filename is not None and filename == "":
        return False
    imposter = to_custom_yaml(data)
    file_path = os.path.join(IMPOSTERS_FOLDER, filename)
    with open(file_path, "w", encoding='utf-8') as f:
        try:
            f.write(imposter)
            print(f"✅ Imposter file Updated: {filename}")
            return True
        except Exception as e:
            print(f"❌ Error in updating imposter {filename}: {e}")
            return False

def delete_imposter(data: Imposter):
    filename = data.imposter.file
    file_path = os.path.join(IMPOSTERS_FOLDER, filename)
    if not os.path.exists(file_path):
        return False
    else:
        os.remove(file_path)
        return True

def load_yaml_imposters(folder=IMPOSTERS_FOLDER):
    """Load YAML imposters from disk into the global list."""
    global imposters
    imposters.clear()

    if not os.path.exists(folder):
        os.makedirs(folder)

    for filename in os.listdir(folder):
        if not filename.endswith((".yaml", ".yml")):
            continue

        file_path = os.path.join(folder, filename)
        with open(file_path, "r") as f:
            try:
                raw = yaml.safe_load(f)
                raw["imposter"]["file"] = filename
                imposter_obj = parse_imposter_yaml(raw)
                imposters.append(imposter_obj)
                print(f"✅ Loaded imposter: {imposter_obj.imposter.name}")
            except Exception as e:
                print(f"❌ Error in {filename}: {e}")


def add_yaml_imposter(data: Dict[str, Any]):
    """Dynamically add a YAML imposter (already parsed) to the global list."""
    try:
        imposter_obj = parse_imposter_yaml(data)
        imposters.append(imposter_obj)
        print(f"✅ Added imposter: {imposter_obj.imposter.name}")
    except Exception as e:
        print(f"❌ Failed to add imposter: {e}")


def list_yaml_imposters() -> List[Imposter]:
    """Return the current global list of imposters."""
    return imposters


def clean_data(data, exclude_keys=None):
    """
    Recursively remove keys with None or blank string values from a dataclass dictionary.
    Also removes explicitly excluded keys.
    """
    if exclude_keys is None:
        exclude_keys = set()

    if isinstance(data, dict):
        return {
            k: clean_data(v, exclude_keys)
            for k, v in data.items()
            if k not in exclude_keys and v not in (None, "") and v
        }
    elif isinstance(data, list):
        return [clean_data(item, exclude_keys) for item in data if item not in (None, "")]
    else:
        return data


def to_custom_yaml(imposter_instance: Imposter) -> str:
    """
    Convert an Imposter instance to YAML:
    - Exclude 'file'
    - Nest 'predicate' and 'responses' under each predicate entry
    - Remove None or empty string fields
    """
    if not is_dataclass(imposter_instance):
        raise TypeError("Expected a dataclass instance")

    data = asdict(imposter_instance)

    # Clean imposter metadata and remove 'file'
    metadata = clean_data(data['imposter'], exclude_keys={'file'})

    # Restructure predicates as list of {'predicate': ..., 'responses': [...]}
    predicate_entries = []
    for pred in data['predicates']:
        pred_copy = pred.copy()
        responses = pred_copy.pop('responses', [])
        entry = {
            'predicate': clean_data(pred_copy),
            'responses': [clean_data(r) for r in responses]
        }
        predicate_entries.append(entry)

    # Final structure
    yaml_data = {
        'imposter': metadata,
        'predicates': predicate_entries
    }

    return yaml.dump(
        yaml_data,
        sort_keys=False,
        default_flow_style=False,
        Dumper=YamlDumper
    )
