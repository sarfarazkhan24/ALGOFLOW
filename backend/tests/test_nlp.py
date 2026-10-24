"""
Unit tests for AlgoFlow NLP pipeline:
preprocessing, tokenization, POS tagging, condition parsing, and classification.
"""
import pytest
from app.nlp.preprocessor import preprocess_algorithm_text
from app.nlp.condition_parser import (
    normalize_condition_text,
    extract_if_condition_and_branches,
    extract_loop_condition,
)
from app.nlp.classifier import classify_statement


def test_preprocessor_segmentation():
    text = """1. Start
2. Read A, B
3. If A > B, print A. Otherwise, print B.
4. End"""
    stmts = preprocess_algorithm_text(text)
    assert len(stmts) >= 4
    assert stmts[0].cleaned_text.lower() == "start"
    assert "read a, b" in stmts[1].cleaned_text.lower()


def test_condition_normalizer():
    assert normalize_condition_text("N is even") == "N % 2 == 0"
    assert normalize_condition_text("A is greater than B") == "A > B"
    assert normalize_condition_text("x is less than or equal to 10") == "x <= 10"


def test_extract_if_condition_and_branches():
    sentence = "If it is even, print Even; otherwise, print Odd"
    cond, true_a, false_a = extract_if_condition_and_branches(sentence)
    assert "even" in cond or "% 2 == 0" in cond
    assert true_a == "print Even"
    assert false_a == "print Odd"


def test_extract_loop_condition():
    sentence = "Repeat while i <= N: add i to sum, increment i by 1"
    cond, body, loop_type = extract_loop_condition(sentence)
    assert loop_type == "while"
    assert "i <= N" in cond
    assert "add i to sum" in body


def test_statement_classification():
    stmt1 = classify_statement(0, "Start", "Start")
    assert stmt1.statement_type == "start"

    stmt2 = classify_statement(1, "Read two numbers, A and B", "Read two numbers, A and B")
    assert stmt2.statement_type == "input"
    assert "A" in stmt2.variables or "B" in stmt2.variables

    stmt3 = classify_statement(2, "Set sum = 0", "Set sum = 0")
    assert stmt3.statement_type == "process"

    stmt4 = classify_statement(3, "If A > B", "If A > B")
    assert stmt4.statement_type == "decision"

    stmt5 = classify_statement(4, "Repeat while i <= 10", "Repeat while i <= 10")
    assert stmt5.statement_type == "loop"

    stmt6 = classify_statement(5, "Print sum", "Print sum")
    assert stmt6.statement_type == "output"

    stmt7 = classify_statement(6, "Stop", "Stop")
    assert stmt7.statement_type == "end"


def test_ambiguous_classification():
    stmt = classify_statement(0, "Random words xyz foo", "Random words xyz foo")
    assert stmt.statement_type in ["ambiguous", "process"]
    assert stmt.confidence <= 0.65
