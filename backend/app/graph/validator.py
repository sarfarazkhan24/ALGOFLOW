"""
Flowchart & Algorithm Validator for AlgoFlow.
Validates the structural integrity and semantic clarity of the generated CFG.
Performs reachability checks, cycle analysis, branch completeness checks,
and ambiguity detection using NetworkX.
"""
from typing import List, Dict, Any, Set
import networkx as nx
from ..models.schema import (
    FlowNode,
    FlowEdge,
    StatementAnalysis,
    ValidationResult,
    ValidationIssue,
)


def validate_flowchart(
    nodes: List[FlowNode],
    edges: List[FlowEdge],
    statements: List[StatementAnalysis],
) -> ValidationResult:
    """
    Validates the flowchart graph structure and semantic completeness.
    Distinguishes structural errors from semantic ambiguities.
    """
    issues: List[ValidationIssue] = []

    if not nodes:
        return ValidationResult(
            is_valid=False,
            errors_count=1,
            warnings_count=0,
            issues=[
                ValidationIssue(
                    level="error",
                    message="No nodes generated from input algorithm text.",
                    suggestion="Please enter algorithm steps, e.g. 'Read a number. If it is even, print Even; otherwise, print Odd.'",
                )
            ],
        )

    # Build NetworkX DiGraph
    G = nx.DiGraph()
    node_map: Dict[str, FlowNode] = {n.id: n for n in nodes}

    for n in nodes:
        G.add_node(n.id, type=n.type, label=n.label)

    for e in edges:
        G.add_edge(e.source, e.target, label=e.label)

    # 1. Check Start Node Presence
    start_nodes = [n for n in nodes if n.type == "start"]
    if not start_nodes:
        issues.append(
            ValidationIssue(
                level="warning",
                message="Missing Start node: The algorithm has no explicit beginning terminator.",
                suggestion="Add 'Start' or 'Begin' at the beginning of your algorithm.",
            )
        )
    elif len(start_nodes) > 1:
        issues.append(
            ValidationIssue(
                level="warning",
                message="Multiple Start nodes detected: Standard flowcharts require a single entry point.",
                suggestion="Consolidate execution entry into one Start node.",
            )
        )

    # 2. Check End Node Presence
    end_nodes = [n for n in nodes if n.type == "end"]
    if not end_nodes:
        issues.append(
            ValidationIssue(
                level="warning",
                message="Missing End node: The algorithm has no termination step.",
                suggestion="Add 'End' or 'Stop' to specify the algorithm termination point.",
            )
        )

    # 3. Check Decision Nodes have required branches
    decision_nodes = [n for n in nodes if n.type == "decision"]
    for dec in decision_nodes:
        out_edges = list(G.out_edges(dec.id, data=True))
        if len(out_edges) < 2:
            issues.append(
                ValidationIssue(
                    level="warning",
                    node_id=dec.id,
                    statement_index=dec.statement_index,
                    message=f"Decision node '{dec.label}' has only {len(out_edges)} outgoing branch. Standard decisions require both True and False outcomes.",
                    suggestion="Specify an 'otherwise' or 'else' branch for this condition.",
                )
            )

    # 4. Check Loop Nodes for back-edge and exit
    loop_nodes = [n for n in nodes if n.type == "loop"]
    cycles = list(nx.simple_cycles(G))
    for lp in loop_nodes:
        # Check if lp is part of at least one cycle
        in_cycle = any(lp.id in cycle for cycle in cycles)
        if not in_cycle:
            issues.append(
                ValidationIssue(
                    level="warning",
                    node_id=lp.id,
                    statement_index=lp.statement_index,
                    message=f"Loop condition '{lp.label}' does not have a returning cycle back-edge.",
                    suggestion="Ensure loop body statements repeat back to the loop test.",
                )
            )

        # Check if loop has an exit path reaching End
        if end_nodes:
            has_exit_path = any(nx.has_path(G, lp.id, end.id) for end in end_nodes)
            if not has_exit_path:
                issues.append(
                    ValidationIssue(
                        level="error",
                        node_id=lp.id,
                        statement_index=lp.statement_index,
                        message=f"Potential infinite loop detected: '{lp.label}' cannot reach an End termination node.",
                        suggestion="Define an exit condition or break statement to terminate the loop.",
                    )
                )

    # 5. Reachability from Start
    if start_nodes:
        primary_start = start_nodes[0].id
        reachable_from_start = nx.descendants(G, primary_start) | {primary_start}
        for n in nodes:
            if n.id not in reachable_from_start:
                issues.append(
                    ValidationIssue(
                        level="warning",
                        node_id=n.id,
                        statement_index=n.statement_index,
                        message=f"Unreachable statement detected: '{n.label}' is disconnected from Start.",
                        suggestion="Check statement ordering or previous branch connections.",
                    )
                )

    # 6. Unconnected Nodes (isolated nodes)
    for n in nodes:
        in_degree = G.in_degree(n.id)
        out_degree = G.out_degree(n.id)
        if n.type != "start" and in_degree == 0:
            issues.append(
                ValidationIssue(
                    level="warning",
                    node_id=n.id,
                    statement_index=n.statement_index,
                    message=f"Node '{n.label}' has no incoming execution connection.",
                    suggestion="Connect a prior step or decision branch to this node.",
                )
            )
        if n.type != "end" and out_degree == 0:
            issues.append(
                ValidationIssue(
                    level="warning",
                    node_id=n.id,
                    statement_index=n.statement_index,
                    message=f"Dead-end node '{n.label}' has no outgoing path and does not terminate with End.",
                    suggestion="Connect this node to the next step or an End terminator.",
                )
            )

    # 7. Semantic Ambiguity & Low Confidence Statements Check
    for stmt in statements:
        if stmt.statement_type == "ambiguous":
            issues.append(
                ValidationIssue(
                    level="warning",
                    statement_index=stmt.index,
                    message=f"Ambiguous instruction: '{stmt.original_text}'. NLP pipeline could not determine operational intent.",
                    suggestion="Clarify the statement using standard keywords like 'Read', 'Print', 'If', 'Set', or 'Repeat'.",
                )
            )
        elif stmt.confidence < 0.65:
            issues.append(
                ValidationIssue(
                    level="warning",
                    statement_index=stmt.index,
                    message=f"Low confidence ({int(stmt.confidence * 100)}%) classification for: '{stmt.original_text}'.",
                    suggestion="Verify if this statement was correctly categorized as " + stmt.statement_type.upper(),
                )
            )

    error_count = sum(1 for i in issues if i.level == "error")
    warning_count = sum(1 for i in issues if i.level == "warning")
    is_valid = error_count == 0

    return ValidationResult(
        is_valid=is_valid,
        errors_count=error_count,
        warnings_count=warning_count,
        issues=issues,
    )
