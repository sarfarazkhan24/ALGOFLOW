"""
AlgoFlow FastAPI Backend Application.
Exposes REST endpoints for natural language algorithm processing,
linguistic analysis, CFG construction, validation, and sample library.
"""
import time
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from .models.schema import (
    AlgorithmInput,
    FlowchartIR,
    ExampleAlgorithm,
    StatementAnalysis,
)
from .nlp.preprocessor import preprocess_algorithm_text
from .nlp.classifier import classify_statement
from .graph.graph_builder import CFGBuilder
from .graph.validator import validate_flowchart


app = FastAPI(
    title="AlgoFlow API",
    description="NLP-Based Algorithm Understanding, Flowchart Generation & Validation System",
    version="1.0.0",
)

# Enable CORS for frontend Vite dev server (and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SAMPLE_ALGORITHMS: List[ExampleAlgorithm] = [
    ExampleAlgorithm(
        id="even-odd",
        title="Even or Odd Checker",
        category="Conditionals",
        description="Reads a number and evaluates whether it is even or odd using an if-else decision.",
        text="""Start.
Read a number.
If it is even, print Even; otherwise, print Odd.
End.""",
    ),
    ExampleAlgorithm(
        id="sum-n",
        title="Sum of First N Numbers",
        category="Loops",
        description="Calculates the sum of integers from 1 to N using a while loop and accumulator.",
        text="""Start.
Read N.
Set sum = 0.
Set i = 1.
Repeat while i <= N: add i to sum, increment i by 1.
Print sum.
End.""",
    ),
    ExampleAlgorithm(
        id="find-max",
        title="Find Maximum of Two Numbers",
        category="Conditionals",
        description="Compares two inputs A and B and prints the larger value.",
        text="""Start.
Read two numbers, A and B.
If A is greater than B, print A.
Otherwise, print B.
End.""",
    ),
    ExampleAlgorithm(
        id="factorial",
        title="Compute Factorial",
        category="Loops",
        description="Calculates N! using repeated multiplication in a loop.",
        text="""Start.
Read positive integer N.
Set fact = 1.
Set count = 1.
Repeat while count <= N: set fact = fact * count, increment count by 1.
Print fact.
End.""",
    ),
    ExampleAlgorithm(
        id="linear-search",
        title="Linear Search",
        category="Advanced",
        description="Iterates through an array to find target item with conditional termination.",
        text="""Start.
Read target value T.
Set index = 0.
Repeat while index < length: check if item equals T, print Found, increment index by 1.
Print Finished.
End.""",
    ),
    ExampleAlgorithm(
        id="ambiguous-demo",
        title="Ambiguous & Incomplete Algorithm (Validation Test)",
        category="Validation & Ambiguity",
        description="Contains ambiguous statements, missing start/end, and unclosed conditions to test validation.",
        text="""Read user data.
Maybe calculate something with X.
If count > 0 then do processing.
Uncertain action here.""",
    ),
]


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AlgoFlow",
        "version": "1.0.0",
        "nlp_engine": "NLTK + Algorithmic Rule Classifier",
        "graph_engine": "NetworkX CFG Builder",
    }


@app.get("/api/examples", response_model=List[ExampleAlgorithm])
def get_examples():
    return SAMPLE_ALGORITHMS


@app.post("/api/analyze", response_model=FlowchartIR)
def analyze_algorithm(input_data: AlgorithmInput):
    start_time = time.time()
    raw_text = input_data.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Input algorithm text cannot be empty.")

    # 1. Preprocess & Segment
    raw_statements = preprocess_algorithm_text(raw_text)
    if not raw_statements:
        raise HTTPException(status_code=400, detail="Could not extract any valid statements from the input.")

    # 2. Linguistic Analysis & Classification
    classified_statements: List[StatementAnalysis] = []
    all_vars = set()

    for idx, raw_stmt in enumerate(raw_statements):
        analysis = classify_statement(
            index=idx,
            raw_text=raw_stmt.raw_text,
            cleaned_text=raw_stmt.cleaned_text,
        )
        classified_statements.append(analysis)
        for v in analysis.variables:
            all_vars.add(v)

    # 3. Graph Construction (CFG)
    builder = CFGBuilder(classified_statements)
    nodes, edges = builder.build()

    # 4. Validation & Ambiguity Detection
    validation_result = validate_flowchart(nodes, edges, classified_statements)

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    decision_count = sum(1 for n in nodes if n.type == "decision")
    loop_count = sum(1 for n in nodes if n.type == "loop")

    stats = {
        "total_statements": len(classified_statements),
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "decision_count": decision_count,
        "loop_count": loop_count,
        "processing_time_ms": elapsed_ms,
    }

    return FlowchartIR(
        title=input_data.title or "Algorithm Flowchart",
        raw_text=raw_text,
        statements=classified_statements,
        nodes=nodes,
        edges=edges,
        validation=validation_result,
        detected_variables=sorted(list(all_vars)),
        stats=stats,
    )


class ExportImageRequest(BaseModel):
    data_url: str
    format: str = "png"
    filename: str = "algoflow-diagram.png"


@app.post("/api/export-image")
def export_image(req: ExportImageRequest):
    """
    Accepts base64 data URL and returns binary file with standard Content-Disposition header.
    Guarantees browser downloads with exact filename and extension.
    """
    import base64
    import urllib.parse

    data_url = req.data_url.strip()
    header, encoded = data_url.split(",", 1) if "," in data_url else ("", data_url)

    if req.format == "svg" or "image/svg+xml" in header:
        content_bytes = (
            urllib.parse.unquote(encoded).encode("utf-8")
            if not header.endswith(";base64")
            else base64.b64decode(encoded)
        )
        media_type = "image/svg+xml"
        filename = req.filename if req.filename.endswith(".svg") else f"{req.filename}.svg"
    else:
        content_bytes = base64.b64decode(encoded)
        media_type = "image/png"
        filename = req.filename if req.filename.endswith(".png") else f"{req.filename}.png"

    return Response(
        content=content_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@app.post("/api/save-to-downloads")
def save_directly_to_downloads(req: ExportImageRequest):
    """
    Saves the exported image directly into the user's Downloads folder
    on disk, bypassing any browser download interception or sandboxing.
    """
    import os
    import base64
    import pathlib

    data_url = req.data_url.strip()
    header, encoded = data_url.split(",", 1) if "," in data_url else ("", data_url)

    if req.format == "svg" or "image/svg+xml" in header:
        import urllib.parse
        content_bytes = (
            urllib.parse.unquote(encoded).encode("utf-8")
            if not header.endswith(";base64")
            else base64.b64decode(encoded)
        )
        ext = ".svg"
    else:
        content_bytes = base64.b64decode(encoded)
        ext = ".png"

    filename = req.filename if req.filename.endswith(ext) else f"{req.filename}{ext}"
    downloads_dir = pathlib.Path.home() / "Downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    target_path = downloads_dir / filename

    with open(target_path, "wb") as f:
        f.write(content_bytes)

    return {
        "status": "success",
        "file_name": filename,
        "file_path": str(target_path),
        "size_bytes": len(content_bytes),
    }


