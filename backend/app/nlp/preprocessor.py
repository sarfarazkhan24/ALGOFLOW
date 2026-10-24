"""
Text Preprocessor for AlgoFlow.
Handles text normalization, sentence segmentation, step number extraction,
and clause decomposition while preserving line numbers and traceability.
"""
import re
from typing import List, Dict, Any


STEP_PREFIX_REGEX = re.compile(
    r"^(?:step\s*\d+[\s:.-]*|\d+[\s:.)-]+\s*|[-*•]\s*)", re.IGNORECASE
)


class RawStatement:
    def __init__(self, raw_text: str, cleaned_text: str, line_no: int, step_label: str = ""):
        self.raw_text = raw_text.strip()
        self.cleaned_text = cleaned_text.strip()
        self.line_no = line_no
        self.step_label = step_label

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_text": self.raw_text,
            "cleaned_text": self.cleaned_text,
            "line_no": self.line_no,
            "step_label": self.step_label,
        }


def preprocess_algorithm_text(text: str) -> List[RawStatement]:
    """
    Cleans and segments raw algorithm text into discrete logical statements.
    Preserves line-level and original text traceability.
    """
    if not text or not text.strip():
        return []

    lines = text.strip().splitlines()
    statements: List[RawStatement] = []
    line_counter = 0

    for line in lines:
        line_counter += 1
        trimmed = line.strip()
        if not trimmed:
            continue

        # Check for step prefix like "1. ", "Step 2: ", "- "
        step_match = STEP_PREFIX_REGEX.match(trimmed)
        step_label = ""
        cleaned_line = trimmed
        if step_match:
            step_label = step_match.group(0).strip()
            cleaned_line = trimmed[step_match.end() :].strip()

        if not cleaned_line:
            continue

        # Check if line contains semicolons separating independent statements (except within quotes/math)
        # e.g., "Read A, B; Set sum = 0"
        sub_segments = [s.strip() for s in re.split(r";(?![^(]*\))", cleaned_line) if s.strip()]

        for segment in sub_segments:
            # Check if this segment contains multiple period-delimited sentences
            # but preserve decimals like 3.14 or abbreviations
            sentence_splits = re.split(r"(?<=[a-zA-Z0-9])\.\s+(?=[A-Z0-9])", segment)
            for s in sentence_splits:
                s_clean = s.strip()
                if s_clean.endswith("."):
                    s_clean = s_clean[:-1].strip()
                if s_clean:
                    statements.append(
                        RawStatement(
                            raw_text=segment if len(sentence_splits) == 1 else s.strip(),
                            cleaned_text=s_clean,
                            line_no=line_counter,
                            step_label=step_label,
                        )
                    )

    return statements
