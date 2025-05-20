import os
import yaml
from typing import List, Dict, Any

from services.constant_service import IMPOSTERS_FOLDER

# Import the dataclasses
from entity.imposter_model import Imposter, ImposterMetadata, ResponseEntry, Predicate, Response

imposters: List[Imposter] = []

def parse_imposter_yaml(data: Dict[str, Any]) -> Imposter:
    """Parse a YAML dictionary into an Imposter object."""
    # Use the ImposterMetadata dataclass for metadata
    metadata = ImposterMetadata(**data["imposter"])

    predicates = []
    for pred_obj in data["predicates"]:
        pred_data = pred_obj.get("predicate", {})
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

def load_yaml_imposters(folder = IMPOSTERS_FOLDER):
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
