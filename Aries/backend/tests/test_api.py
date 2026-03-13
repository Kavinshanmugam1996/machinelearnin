import pytest
from httpx import AsyncClient
from database.models import User, Question, QuestionMapper
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

@pytest.mark.asyncio
async def test_get_questions_none_selected(client: AsyncClient, db_session):
    # Setup user and login
    test_user = User(email="tester@example.com", hashed_password="password123")
    db_session.add(test_user)
    await db_session.commit()

    login_res = await client.post(
        "/api/login",
        json={"email": "tester@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request questions with "None" selected
    request_data = {
        "inventory": [{"description": "No AI", "useCase": "None of the above / No specific AI use cases"}],
        "industry": "Retail"
    }

    response = await client.post(
        "/api/get-questions",
        json=request_data,
        headers=headers
    )
    assert response.status_code == 200
    questions = response.json()
    
    # Verify that mandatory groups or generic questions are returned
    mandatory_groups = ["privacy", "security", "reliability", "legal_regulatory"]
    for q in questions:
        group = q.get("component_group")
        assert group in mandatory_groups or group == "" or group is None

@pytest.mark.asyncio
async def test_get_questions_mixed_inventory(client: AsyncClient, db_session):
    # Setup seed data
    mapper = QuestionMapper(use_case="Customer chatbot", component_groups="security, ai_technical")
    db_session.add(mapper)
    
    q1 = Question(qid="Q_SEC_1", text="Security Question", component_group="security", industry="Universal", options=[])
    q2 = Question(qid="Q_AI_1", text="AI Tech Question", component_group="ai_technical", industry="Retail", options=[])
    q3 = Question(qid="Q_CORE_1", text="Core Question", component_group="", industry="Universal", options=[])
    db_session.add_all([q1, q2, q3])
    
    # Setup user and login
    test_user = User(email="tester2@example.com", hashed_password="password123")
    db_session.add(test_user)
    await db_session.commit()

    login_res = await client.post(
        "/api/login",
        json={"email": "tester2@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    request_data = {
        "inventory": [{"description": "Chatbot", "useCase": "Customer chatbot"}],
        "industry": "Retail"
    }

    response = await client.post(
        "/api/get-questions",
        json=request_data,
        headers=headers
    )
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) > 0

@pytest.mark.asyncio
async def test_get_assessment(client: AsyncClient, db_session):
    # Setup user and login
    test_user = User(email="sync@example.com", hashed_password="password123")
    db_session.add(test_user)
    await db_session.commit()

    login_res = await client.post(
        "/api/login",
        json={"email": "sync@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get assessment for a new ID (should be blank)
    res = await client.get("/api/assessment/new-client", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "new-client"
    assert data["answers"] == {}

    # 2. Save an assessment
    save_data = {
        "id": "new-client",
        "name": "Sync Test",
        "profile": {"companyName": "Sync Corp"},
        "answers": {"q1": "Yes"},
        "currentQuestionIndex": 5,
        "totalQuestions": 10
    }
    await client.post("/api/save", json=save_data, headers=headers)
    
    # 3. Get it back
    res = await client.get("/api/assessment/new-client", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Sync Test"
    assert data["answers"]["q1"] == "Yes"

