"""Regression coverage for the representative chatbot questions used in the UI."""

import pytest
from fastapi.testclient import TestClient

from main import app


client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture(autouse=True)
def disable_external_provider(monkeypatch):
    """Keep deterministic regression tests independent from provider quota."""
    monkeypatch.setattr("routers.chatbot.get_provider", lambda: None)
    monkeypatch.setattr("services.llm_service.get_provider", lambda: None)


@pytest.mark.parametrize(("question", "expected"), [
    ("What is the current headcount?", "543"),
    ("Projected HC Month-end?", "Projected HC month-end is 543"),
    ("What is the billable headcount?", "84%"),
    ("give the total billabale percentage in june month", "does not contain a month-specific"),
    ("What is the timesheet compliance?", "91%"),
    ("What are the leakage hours?", "268"),
    ("What was the utilization in January?", "72%"),
    ("Who are the users in Bangalore?", "21 users"),
    ("How many people are in Pune?", "9 users"),
    ("Who has status Active?", "134 users"),
    ("Who is on leave?", "No users"),
    ("Who works on the NatWest project?", "No users"),
    ("List all users in London.", "No users"),
    ("Who are the leadership team members?", "13 leadership members"),
    ("Which events are upcoming?", "no upcoming events"),
    ("What is the next event?", "no upcoming or active events"),
    ("List all completed events.", "Natwest Q1 Townhall"),
    ("Which events are active?", "no active events"),
    ("How many AI-based deliverables do we have?", "1 AI-based"),
    ("List all AI deliverables.", "Implementing AWS COMET"),
    ("Which programs belong to the D&A franchise?", "Single Pane of Glass"),
    ("What capabilities does the app have?", "7 capabilities"),
    ("What franchises are under D&A+?", "FinCrime"),
    ("What are the main domains and service areas?", "Retail Banking"),
    ("Who received the Employee of the Month award?", "Megha Jagadeesh"),
    ("Show all recognitions.", "Rajesh Jindal"),
    ("What is the grand total for D&A+?", "47"),
    ("How does Accenture help in Retail Banking?", "mortgages"),
    ("What service areas are covered?", "Infrastructure & Security"),
    ("bye", "Goodbye"),
])
def test_sample_chatbot_queries(question, expected):
    response = client.post("/api/chatbot/ask", json={"question": question})

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "local-retrieval"
    assert expected.lower() in body["answer"].lower()
