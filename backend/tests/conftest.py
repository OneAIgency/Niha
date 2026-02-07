"""Pytest fixtures for backend tests. Tests run against the same DB as the app (e.g. in Docker)."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for all async tests so the app's DB engine pool is not shared across loops."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """FastAPI test client (sync). Use when running pytest inside the backend container."""
    return TestClient(app)
