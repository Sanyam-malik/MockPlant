from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

@dataclass
class ImposterMetadata:
    """Represents the metadata of an imposter (name, type, description)."""
    name: str
    description: Optional[str] = ""
    type: str = "HTTP"

@dataclass
class Response:
    """Represents a single response code and content"""
    code: int
    content: str

@dataclass
class ResponseEntry:
    """Represents a single response along with optional matching conditions."""
    response: Response
    when: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class Predicate:
    """Represents a request matching rule and associated responses."""
    method: str
    path: str
    delay: Optional[str] = None
    force_response: Optional[int] = None
    responses: List[ResponseEntry] = field(default_factory=list)

@dataclass
class Imposter:
    """Represents an imposter configuration with metadata and predicates."""
    imposter: ImposterMetadata
    predicates: List[Predicate] = field(default_factory=list)
