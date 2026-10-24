"""
Algorithmic Statement Classifier for AlgoFlow.
Classifies natural language statements into standard algorithmic primitives:
Start, End, Input, Output, Process, Decision, Loop, and Ambiguous.
Provides explainable classification reasoning and confidence metrics.
"""
import re
from typing import List
from ..models.schema import StatementAnalysis, TokenInfo
from .linguistic_analyzer import analyze_tokens_and_pos, extract_action_verb, extract_variables
from .condition_parser import (
    extract_if_condition_and_branches,
    extract_loop_condition,
    normalize_condition_text,
)


START_PATTERNS = [
    r"^(?:start|begin|initialize\s+algorithm|entry\s+point)\b",
]

END_PATTERNS = [
    r"^(?:stop|end|finish|terminate|exit|end\s+algorithm)\b",
]

INPUT_VERBS = {"read", "input", "get", "take", "receive", "enter", "accept", "prompt", "obtain"}
OUTPUT_VERBS = {"print", "display", "output", "show", "write", "return", "yield"}
PROCESS_VERBS = {
    "set", "assign", "calculate", "compute", "add", "subtract", "multiply", "divide",
    "increment", "decrement", "update", "initialize", "store", "find", "swap", "reset"
}
LOOP_STARTERS = {"repeat", "while", "until", "for", "loop", "iterate", "as long as"}
DECISION_STARTERS = {"if", "check", "verify", "whether", "is", "compare"}


def classify_statement(index: int, raw_text: str, cleaned_text: str) -> StatementAnalysis:
    """Classifies a cleaned text statement into an algorithmic category with rationale."""
    s_lower = cleaned_text.lower().strip()
    tokens = analyze_tokens_and_pos(cleaned_text)
    action_verb = extract_action_verb(cleaned_text, tokens)
    variables = extract_variables(cleaned_text, tokens)

    # 1. Start check
    for p in START_PATTERNS:
        if re.search(p, s_lower):
            return StatementAnalysis(
                index=index,
                original_text=raw_text,
                cleaned_text=cleaned_text,
                statement_type="start",
                confidence=0.98,
                reason="Begins execution flow with canonical start/begin terminator.",
                action_verb=action_verb or "start",
                variables=variables,
                tokens=tokens,
            )

    # 2. End check
    for p in END_PATTERNS:
        if re.search(p, s_lower):
            return StatementAnalysis(
                index=index,
                original_text=raw_text,
                cleaned_text=cleaned_text,
                statement_type="end",
                confidence=0.98,
                reason="Terminates execution flow with canonical stop/end terminator.",
                action_verb=action_verb or "end",
                variables=variables,
                tokens=tokens,
            )

    # 3. Else / Otherwise branch check
    if re.match(r"^(?:otherwise|else)\b", s_lower):
        # Extract the action inside the else branch
        sub_action = re.sub(r"^(?:otherwise|else)\s*[,:]?\s*", "", cleaned_text, flags=re.IGNORECASE).strip()
        sub_type = "process"
        sub_tokens = analyze_tokens_and_pos(sub_action) if sub_action else []
        sub_verb = extract_action_verb(sub_action, sub_tokens) if sub_action else ""
        if sub_verb in OUTPUT_VERBS:
            sub_type = "output"
        elif sub_verb in INPUT_VERBS:
            sub_type = "input"

        return StatementAnalysis(
            index=index,
            original_text=raw_text,
            cleaned_text=sub_action or cleaned_text,
            statement_type=sub_type,
            confidence=0.92,
            reason=f"Identified as 'False/Otherwise' decision branch performing a {sub_type} operation.",
            action_verb=sub_verb or "otherwise",
            variables=variables,
            branch_type="false_branch",
            tokens=tokens,
        )

    # 4. Loop check (Repeat while, while, repeat until, for)
    loop_cond, loop_body, loop_kind = extract_loop_condition(cleaned_text)
    if loop_cond is not None:
        return StatementAnalysis(
            index=index,
            original_text=raw_text,
            cleaned_text=cleaned_text,
            statement_type="loop",
            confidence=0.95,
            reason=f"Repetition structure identified ({loop_kind} loop) testing condition: {loop_cond}.",
            action_verb="loop",
            variables=variables,
            condition_expr=loop_cond,
            branch_type=None,
            tokens=tokens,
        )

    # 5. Decision check (If, Check if, Whether)
    if any(s_lower.startswith(d) for d in DECISION_STARTERS) or " if " in s_lower:
        cond_expr, true_action, false_action = extract_if_condition_and_branches(cleaned_text)
        if cond_expr:
            return StatementAnalysis(
                index=index,
                original_text=raw_text,
                cleaned_text=cleaned_text,
                statement_type="decision",
                confidence=0.95,
                reason=f"Conditional branching decision node testing predicate: '{cond_expr}'.",
                action_verb="check",
                variables=variables,
                condition_expr=cond_expr,
                tokens=tokens,
            )
        else:
            # Contains 'if' but couldn't parse clean condition -> flag as potentially ambiguous decision
            return StatementAnalysis(
                index=index,
                original_text=raw_text,
                cleaned_text=cleaned_text,
                statement_type="decision",
                confidence=0.70,
                reason="Conditional construct detected, but condition expression requires clarification.",
                action_verb="if",
                variables=variables,
                condition_expr=cleaned_text,
                tokens=tokens,
            )

    # 6. Input check
    if action_verb in INPUT_VERBS or re.search(r"\b(?:input|read)\s+[a-zA-Z0-9_, ]+", s_lower):
        return StatementAnalysis(
            index=index,
            original_text=raw_text,
            cleaned_text=cleaned_text,
            statement_type="input",
            confidence=0.95,
            reason=f"Data input operation detected via action verb '{action_verb}' for variables: {', '.join(variables) if variables else 'values'}.",
            action_verb=action_verb or "read",
            variables=variables,
            tokens=tokens,
        )

    # 7. Output check
    if action_verb in OUTPUT_VERBS or re.search(r"\b(?:print|display|output)\s+", s_lower):
        return StatementAnalysis(
            index=index,
            original_text=raw_text,
            cleaned_text=cleaned_text,
            statement_type="output",
            confidence=0.95,
            reason=f"Data output operation detected via action verb '{action_verb}'.",
            action_verb=action_verb or "print",
            variables=variables,
            tokens=tokens,
        )

    # 8. Process check
    # Check assignment equations (e.g. "sum = 0", "i = i + 1", "set x to y")
    is_assignment = bool(re.search(r"[a-zA-Z_]\w*\s*(?:=|\+=|-=|\*=)\s*.+", cleaned_text))
    if action_verb in PROCESS_VERBS or is_assignment:
        return StatementAnalysis(
            index=index,
            original_text=raw_text,
            cleaned_text=cleaned_text,
            statement_type="process",
            confidence=0.92,
            reason=f"Computational or state-mutation process ({action_verb or 'assignment'}).",
            action_verb=action_verb or "assign",
            variables=variables,
            tokens=tokens,
        )

    # 9. Fallback / Ambiguity check
    # If it has some variables or numbers, treat as process with lower confidence
    if variables:
        return StatementAnalysis(
            index=index,
            original_text=raw_text,
            cleaned_text=cleaned_text,
            statement_type="process",
            confidence=0.60,
            reason="Heuristic classification as process based on detected identifiers, but action verb was ambiguous.",
            action_verb="",
            variables=variables,
            tokens=tokens,
        )

    # Completely unrecognized statement
    return StatementAnalysis(
        index=index,
        original_text=raw_text,
        cleaned_text=cleaned_text,
        statement_type="ambiguous",
        confidence=0.30,
        reason="Unable to determine algorithmic role; missing standard action verbs, conditions, or variables.",
        action_verb="",
        variables=[],
        tokens=tokens,
    )
