"""
Condition Parser and Semantic Normalizer for AlgoFlow.
Extracts and normalizes conditional expressions, operators, and loop criteria.
"""
import re
from typing import Tuple, Optional


COMPARISON_PHRASES = [
    (r"\bis\s+greater\s+than\s+or\s+equal\s+to\b", ">="),
    (r"\bis\s+less\s+than\s+or\s+equal\s+to\b", "<="),
    (r"\bis\s+not\s+equal\s+to\b", "!="),
    (r"\bis\s+greater\s+than\b", ">"),
    (r"\bis\s+less\s+than\b", "<"),
    (r"\bis\s+equal\s+to\b", "=="),
    (r"\bequals\b", "=="),
    (r"\bis\s+even\b", "% 2 == 0"),
    (r"\bis\s+odd\b", "% 2 != 0"),
    (r"\bis\s+divisible\s+by\s+([a-zA-Z0-9]+)\b", r"% \1 == 0"),
    (r"\bis\s+positive\b", "> 0"),
    (r"\bis\s+negative\b", "< 0"),
    (r"\bis\s+zero\b", "== 0"),
    (r"\bis\s+null\b", "== null"),
]


def normalize_condition_text(text: str) -> str:
    """Normalizes natural language comparisons into concise mathematical symbols."""
    normalized = text
    for pattern, replacement in COMPARISON_PHRASES:
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
    # Clean up excess spaces
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def extract_if_condition_and_branches(sentence: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Parses a sentence that might have an if-clause, then-action, and else-action.
    Examples:
      - "If A > B, print A; otherwise, print B"
      - "If it is even, print Even; else print Odd"
      - "If N is positive then print Positive"
      - "If N > 0:"
    Returns:
      (condition_expr, true_action, false_action)
    """
    cleaned = sentence.strip()

    # Pattern 1: If <cond>, <true_action> (otherwise|else) <false_action>
    m1 = re.match(
        r"^(?:if|check\s+if|when)\s+(.+?)(?:,\s*then\s+|;\s*then\s+|\s+then\s+|,\s+)(.+?)(?:[;,]?\s*(?:otherwise|else)\s*[,:]?\s*(.+))?$",
        cleaned,
        re.IGNORECASE,
    )
    if m1:
        cond_raw = m1.group(1).strip()
        true_action = m1.group(2).strip()
        false_action = m1.group(3).strip() if m1.group(3) else None
        return normalize_condition_text(cond_raw), true_action, false_action

    # Pattern 2: If <cond>:
    m2 = re.match(r"^(?:if|check\s+if|when)\s+(.+?)(?:[:?]|,\s*)?$", cleaned, re.IGNORECASE)
    if m2:
        cond_raw = m2.group(1).strip().rstrip("?:")
        return normalize_condition_text(cond_raw), None, None

    return None, None, None


def extract_loop_condition(sentence: str) -> Tuple[Optional[str], Optional[str], str]:
    """
    Parses loop statements like:
      - "Repeat while i <= N: add i to sum, increment i by 1"
      - "While count < 10, print count"
      - "Repeat until flag is true"
      - "For i from 1 to N"
    Returns:
      (condition_expr, loop_body_action, loop_type: 'while' | 'until' | 'for')
    """
    cleaned = sentence.strip()

    # Repeat while <cond> [: or ,] <body>
    m_rw = re.match(r"^(?:repeat\s+while|while|as\s+long\s+as)\s+(.+?)(?:[:,-]\s*(.+))?$", cleaned, re.IGNORECASE)
    if m_rw:
        cond = normalize_condition_text(m_rw.group(1).strip())
        body = m_rw.group(2).strip() if m_rw.group(2) else None
        return cond, body, "while"

    # Repeat until <cond> [: or ,] <body>
    m_ru = re.match(r"^repeat\s+until\s+(.+?)(?:[:,-]\s*(.+))?$", cleaned, re.IGNORECASE)
    if m_ru:
        cond = normalize_condition_text(m_ru.group(1).strip())
        body = m_ru.group(2).strip() if m_ru.group(2) else None
        return f"NOT ({cond})", body, "until"

    # For <var> from <start> to <end>
    m_for = re.match(r"^for\s+([a-zA-Z_]\w*)\s+(?:from|=)\s+(.+?)\s+to\s+(.+?)(?:[:,-]\s*(.+))?$", cleaned, re.IGNORECASE)
    if m_for:
        var = m_for.group(1)
        start = m_for.group(2).strip()
        end = m_for.group(3).strip()
        body = m_for.group(4).strip() if m_for.group(4) else None
        return f"{var} <= {end} (start {var}={start})", body, "for"

    return None, None, "unknown"
