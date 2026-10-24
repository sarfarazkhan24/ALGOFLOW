"""
Unit tests for AlgoFlow CFG builder and structural validator.
"""
import pytest
from app.nlp.classifier import classify_statement
from app.graph.graph_builder import CFGBuilder
from app.graph.validator import validate_flowchart


def test_cfg_builder_simple_sequence():
    stmts = [
        classify_statement(0, "Start", "Start"),
        classify_statement(1, "Read N", "Read N"),
        classify_statement(2, "Print N", "Print N"),
        classify_statement(3, "End", "End"),
    ]
    builder = CFGBuilder(stmts)
    nodes, edges = builder.build()

    assert any(n.type == "start" for n in nodes)
    assert any(n.type == "input" for n in nodes)
    assert any(n.type == "output" for n in nodes)
    assert any(n.type == "end" for n in nodes)
    assert len(edges) >= 3

    val = validate_flowchart(nodes, edges, stmts)
    assert val.is_valid is True
    assert val.errors_count == 0


def test_cfg_builder_if_else():
    stmts = [
        classify_statement(0, "Start", "Start"),
        classify_statement(1, "Read a number", "Read a number"),
        classify_statement(2, "If it is even, print Even; otherwise, print Odd", "If it is even, print Even; otherwise, print Odd"),
        classify_statement(3, "End", "End"),
    ]
    builder = CFGBuilder(stmts)
    nodes, edges = builder.build()

    decision_nodes = [n for n in nodes if n.type == "decision"]
    assert len(decision_nodes) >= 1

    # Check for True and False edge labels
    true_edges = [e for e in edges if e.label == "True"]
    false_edges = [e for e in edges if e.label == "False"]
    assert len(true_edges) >= 1
    assert len(false_edges) >= 1


def test_cfg_builder_loop():
    stmts = [
        classify_statement(0, "Start", "Start"),
        classify_statement(1, "Read N", "Read N"),
        classify_statement(2, "Set sum = 0", "Set sum = 0"),
        classify_statement(3, "Repeat while i <= N: add i to sum, increment i by 1", "Repeat while i <= N: add i to sum, increment i by 1"),
        classify_statement(4, "Print sum", "Print sum"),
        classify_statement(5, "End", "End"),
    ]
    builder = CFGBuilder(stmts)
    nodes, edges = builder.build()

    loop_nodes = [n for n in nodes if n.type == "loop"]
    assert len(loop_nodes) >= 1

    # Check for back-edge / repeat edge
    repeat_edges = [e for e in edges if e.label == "Repeat" or e.edge_type == "backedge"]
    assert len(repeat_edges) >= 1

    val = validate_flowchart(nodes, edges, stmts)
    assert val.is_valid is True


def test_validator_ambiguous_reporting():
    stmts = [
        classify_statement(0, "Maybe do something with X", "Maybe do something with X"),
    ]
    builder = CFGBuilder(stmts)
    nodes, edges = builder.build()
    val = validate_flowchart(nodes, edges, stmts)

    # Should have warning regarding ambiguity
    assert val.warnings_count >= 1
