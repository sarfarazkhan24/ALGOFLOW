# AlgoFlow: NLP-Based Algorithm Understanding, Flowchart Generation & Validation System

AlgoFlow transforms natural-language algorithm descriptions into verified, interactive, and editable flowcharts using an explicit NLP and Control-Flow Graph (CFG) pipeline.

## System Architecture

```
NLP/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI routes, CORS, example library
│   │   ├── models/
│   │   │   └── schema.py               # Pydantic schemas for IR, nodes, edges, validation
│   │   ├── nlp/
│   │   │   ├── preprocessor.py         # Text segmentation & step normalization
│   │   │   ├── linguistic_analyzer.py  # NLTK POS tagging, action verbs, variable extraction
│   │   │   ├── condition_parser.py     # Comparison operator & condition normalizer
│   │   │   └── classifier.py           # Statement classifier (Start, End, Input, Decision, Loop, etc.)
│   │   └── graph/
│   │       ├── graph_builder.py        # CFG generator (branching, loops, back-edges, merge joins)
│   │       └── validator.py            # NetworkX structural & semantic validation
│   ├── tests/
│   │   ├── test_nlp.py                 # Linguistic analysis & classifier tests
│   │   ├── test_graph.py               # CFG & validator tests
│   │   └── test_api.py                 # FastAPI integration tests
│   └── run.py                          # Launcher script
└── frontend/
    ├── src/
    │   ├── App.jsx                     # Interactive split-screen layout & canvas
    │   ├── components/
    │   │   ├── Header.jsx              # Status, metrics, orientation toggle, export
    │   │   ├── EditorPanel.jsx         # Text editor, presets, statement traceability
    │   │   ├── ValidationPanel.jsx     # Structural errors & ambiguity warnings
    │   │   ├── NodeDetailDrawer.jsx    # Live node label editing & provenance
    │   │   ├── NLPInspectorModal.jsx   # POS tags, tokens, reasoning modal
    │   │   ├── IRViewerModal.jsx       # Intermediate Representation JSON modal
    │   │   ├── nodes/                  # Custom flowchart shapes (Pill, Parallelogram, Diamond, etc.)
    │   │   └── edges/                  # Custom flow edges with True/False badges
    │   └── utils/
    │       ├── layout.js               # Dagre hierarchical layout (TB / LR)
    │       └── export.js               # PNG, SVG, and JSON IR export helpers
    └── vite.config.js                  # Vite server & proxy configuration
```

## Quick Start

### 1. Start Backend Server
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation: `http://127.0.0.1:8000/docs`

### 2. Start Frontend Application
```powershell
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Backend Test Suite
```powershell
cd backend
python -m pytest tests -v
```

## Key Features

- **Genuine NLP Pipeline**: Performs sentence segmentation, tokenization, POS tagging, action verb extraction, and semantic argument parsing.
- **True Control-Flow Extraction**: Models sequential execution, conditional branching (`True` and `False`), branch reconvergence, loop bodies, back-edges, and loop exits.
- **Structural & Semantic Validation**: Powered by NetworkX to detect missing terminals, unreachable statements, incomplete decisions, infinite loops, and ambiguous instructions.
- **Interactive Flowchart Canvas**: Custom flowchart shapes (Terminator, Parallelogram, Rectangle, Diamond, Loop preparation) with auto-layout via Dagre, zoom/pan, and live inline editing.
- **Two-Way Traceability**: Click any node to highlight its source sentence and inspect NLP classification details; click any statement in the editor to locate its node.
- **Export Options**: Export high-resolution PNG, vector SVG, or structured JSON Intermediate Representation.
