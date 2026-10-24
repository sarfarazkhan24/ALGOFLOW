"""
Data models and schemas for AlgoFlow Intermediate Representation (IR),
Linguistic Analysis, and Validation.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AlgorithmInput(BaseModel):
    text: str = Field(..., description="The natural language algorithm description")
    title: Optional[str] = Field("My Algorithm", description="Optional algorithm title")


class TokenInfo(BaseModel):
    text: str
    pos: str
    tag: str
    is_verb: bool = False
    is_variable: bool = False
    is_control: bool = False


class StatementAnalysis(BaseModel):
    index: int
    original_text: str
    cleaned_text: str
    statement_type: str  # start, end, input, output, process, decision, loop, ambiguous
    confidence: float
    reason: str
    action_verb: Optional[str] = None
    variables: List[str] = Field(default_factory=list)
    condition_expr: Optional[str] = None
    branch_type: Optional[str] = None  # None, "true_branch", "false_branch", "loop_body"
    tokens: List[TokenInfo] = Field(default_factory=list)


class FlowNode(BaseModel):
    id: str
    type: str  # start, end, input, output, process, decision, loop, ambiguous
    label: str
    original_text: str
    statement_index: int
    condition: Optional[str] = None
    variables: List[str] = Field(default_factory=list)
    confidence: float = 1.0
    details: Dict[str, Any] = Field(default_factory=dict)


class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None  # "True", "False", "Loop", "Exit", etc.
    edge_type: str = "default"  # default, smoothstep, backedge


class ValidationIssue(BaseModel):
    level: str  # "error", "warning", "info"
    node_id: Optional[str] = None
    statement_index: Optional[int] = None
    message: str
    suggestion: Optional[str] = None


class ValidationResult(BaseModel):
    is_valid: bool
    errors_count: int
    warnings_count: int
    issues: List[ValidationIssue] = Field(default_factory=list)


class FlowchartIR(BaseModel):
    title: str = "Algorithm Flowchart"
    raw_text: str
    statements: List[StatementAnalysis] = Field(default_factory=list)
    nodes: List[FlowNode] = Field(default_factory=list)
    edges: List[FlowEdge] = Field(default_factory=list)
    validation: ValidationResult
    detected_variables: List[str] = Field(default_factory=list)
    stats: Dict[str, Any] = Field(default_factory=dict)


class ExampleAlgorithm(BaseModel):
    id: str
    title: str
    description: str
    category: str
    text: str
