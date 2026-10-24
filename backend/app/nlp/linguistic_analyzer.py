"""
Linguistic Analyzer for AlgoFlow.
Performs POS tagging, token-level analysis, action verb identification,
and variable/argument extraction using NLTK and algorithmic grammar patterns.
"""
import re
from typing import List, Tuple, Set
import nltk
from ..models.schema import TokenInfo


COMMON_VARIABLE_NAMES = {
    "a", "b", "c", "d", "e", "f", "i", "j", "k", "m", "n", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "sum", "total", "count", "counter", "num", "number", "numbers", "val", "value", "max", "min", "maximum", "minimum",
    "result", "res", "avg", "average", "fact", "factorial", "prod", "product", "temp", "flag", "arr", "array", "list",
    "item", "target", "key", "index", "mid", "low", "high", "rem", "remainder", "quotient"
}

CONTROL_WORDS = {
    "if", "else", "otherwise", "then", "while", "until", "repeat", "for", "loop", "end", "start", "stop", "begin"
}

IMPERATIVE_VERBS = {
    "read", "input", "get", "take", "receive", "enter", "accept",
    "print", "display", "output", "show", "write", "return",
    "set", "assign", "calculate", "compute", "add", "subtract", "multiply", "divide",
    "increment", "decrement", "update", "initialize", "store", "find", "check", "compare",
    "repeat", "loop", "iterate", "stop", "terminate", "begin", "start"
}


def analyze_tokens_and_pos(sentence: str) -> List[TokenInfo]:
    """Tokenizes and assigns Part of Speech tags to the input statement."""
    tokens_list: List[TokenInfo] = []
    try:
        raw_words = nltk.word_tokenize(sentence)
        tagged = nltk.pos_tag(raw_words)
    except Exception:
        # Fallback regex tokenizer & simple heuristic tagger if NLTK tagger has an issue
        raw_words = re.findall(r"[a-zA-Z_]\w*|[0-9]+|!=|<=|>=|==|[+\-*/=<>()]", sentence)
        tagged = [(w, "VB" if w.lower() in IMPERATIVE_VERBS else "NN") for w in raw_words]

    for word, tag in tagged:
        w_lower = word.lower()
        is_verb = tag.startswith("VB") or (w_lower in IMPERATIVE_VERBS)
        is_control = w_lower in CONTROL_WORDS
        is_variable = (
            (w_lower in COMMON_VARIABLE_NAMES or (len(word) == 1 and word.isalpha()))
            and not is_control
            and not is_verb
        )
        tokens_list.append(
            TokenInfo(
                text=word,
                pos=tag,
                tag=tag,
                is_verb=is_verb,
                is_variable=is_variable,
                is_control=is_control,
            )
        )

    return tokens_list


def extract_action_verb(sentence: str, tokens: List[TokenInfo]) -> str:
    """Finds the primary action verb governing the algorithmic statement."""
    # First check the first non-punctuation token for imperative verbs
    for t in tokens:
        if t.text.isalnum():
            if t.text.lower() in IMPERATIVE_VERBS or t.is_verb:
                return t.text.lower()
            break

    # Otherwise search anywhere in the sentence for known algorithmic verbs
    for t in tokens:
        if t.text.lower() in IMPERATIVE_VERBS:
            return t.text.lower()

    # Fallback to any POS verb
    for t in tokens:
        if t.is_verb and t.text.lower() not in {"is", "are", "was", "were", "be", "been"}:
            return t.text.lower()

    return ""


def extract_variables(sentence: str, tokens: List[TokenInfo]) -> List[str]:
    """Extracts identifier and variable names referenced in the statement."""
    vars_found: Set[str] = set()

    for t in tokens:
        if t.is_variable:
            vars_found.add(t.text)

    # Also detect variables via patterns like "Read two numbers, A and B"
    explicit_vars = re.findall(r"\b([A-Z][a-zA-Z0-9_]*)\b", sentence)
    for v in explicit_vars:
        if v.lower() not in CONTROL_WORDS and v.lower() not in {"if", "or", "and", "not", "then"}:
            vars_found.add(v)

    # Detect math assignments like "sum = sum + i"
    assign_vars = re.findall(r"\b([a-zA-Z_]\w*)\s*(?:=|\+=|-=)", sentence)
    for v in assign_vars:
        if v.lower() not in CONTROL_WORDS:
            vars_found.add(v)

    return sorted(list(vars_found))
