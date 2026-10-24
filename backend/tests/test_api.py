"""
API integration tests for AlgoFlow backend endpoints.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"


def test_examples_endpoint():
    response = client.get("/api/examples")
    assert response.status_code == 200
    examples = response.json()
    assert len(examples) >= 4
    assert any(e["id"] == "even-odd" for e in examples)


def test_analyze_even_odd_algorithm():
    payload = {
        "title": "Even Odd Test",
        "text": "Start. Read a number. If it is even, print Even; otherwise, print Odd. End."
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert "validation" in data
    assert len(data["nodes"]) >= 4
    assert data["validation"]["is_valid"] is True


def test_analyze_sum_n_loop_algorithm():
    payload = {
        "title": "Sum N Test",
        "text": "Start. Read N. Set sum = 0. Set i = 1. Repeat while i <= N: add i to sum, increment i by 1. Print sum. End."
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["loop_count"] >= 1
    assert data["validation"]["is_valid"] is True


def test_export_image_endpoint():
    payload = {
        "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "format": "png",
        "filename": "algoflow-diagram.png"
    }
    response = client.post("/api/export-image", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert "algoflow-diagram.png" in response.headers["content-disposition"]
    assert len(response.content) > 0

