import pytest
from httpx import AsyncClient
from database.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session):
    # Setup a test user
    # Note: main.py currently does plain text check, but models are ready for hashing.
    # Our test should match the implementation in main.py.
    # main.py verify_password returns plain_password == stored_password
    test_user = User(email="test@example.com", hashed_password="password123")
    db_session.add(test_user)
    await db_session.commit()

    response = await client.post(
        "/api/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient):
    response = await client.post(
        "/api/login",
        json={"email": "wrong@example.com", "password": "wrong"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_route_unauthorized(client: AsyncClient):
    response = await client.get("/api/clients")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_save_assessment(client: AsyncClient, db_session):
    # Setup user and login to get token
    test_user = User(email="user@example.com", hashed_password="password123")
    db_session.add(test_user)
    await db_session.commit()

    login_res = await client.post(
        "/api/login",
        json={"email": "user@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    assessment_data = {
        "id": "client-123",
        "name": "Test Client",
        "profile": {"industry": "Tech"},
        "answers": {"q1": "yes"},
        "currentQuestionIndex": 5
    }

    response = await client.post(
        "/api/save",
        json=assessment_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verify retrieval
    res_clients = await client.get("/api/clients", headers=headers)
    assert res_clients.status_code == 200
    clients = res_clients.json()
    assert len(clients) == 1
    assert clients[0]["id"] == "client-123"
