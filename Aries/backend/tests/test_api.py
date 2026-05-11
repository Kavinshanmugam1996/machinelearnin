import pytest
from httpx import AsyncClient
from database.models import (
    User,
    Question,
    Domain,
    Department,
    Cluster,
    Category,
    UseCase,
    UseCaseCategoryWeight,
)


async def _seed_question_graph(db_session):
    domain_general = Domain(id=1, name="General")
    domain_retail = Domain(id=2, name="Retail")
    dept = Department(id=1, name="Cybersecurity")
    cluster = Cluster(id=1, code=1, name="AI Technical & Model Integrity")
    category_security = Category(id=1, slug="ai_system_security_adversarial_risk", question_count=1)
    category_tech = Category(id=2, slug="agents_and_agent_orchestration", question_count=1)

    use_case = UseCase(id=1, name="Customer chatbot")
    weight_security = UseCaseCategoryWeight(use_case_id=1, category_id=1, weight=1)
    weight_tech = UseCaseCategoryWeight(use_case_id=1, category_id=2, weight=1)

    q1 = Question(
        id=1,
        qid_code="Q_SEC_1",
        question_text="Security Question",
        domain_id=2,
        dept_id=1,
        category_id=1,
        cluster_id=1,
        response_type="Yes|No|Partial|Not Applicable",
        is_universal=False,
    )
    q2 = Question(
        id=2,
        qid_code="Q_AI_1",
        question_text="AI Tech Question",
        domain_id=2,
        dept_id=1,
        category_id=2,
        cluster_id=1,
        response_type="Yes|No|Partial|Not Applicable",
        is_universal=False,
    )
    q3 = Question(
        id=3,
        qid_code="Q_CORE_1",
        question_text="Core Universal Question",
        domain_id=1,
        dept_id=1,
        category_id=1,
        cluster_id=1,
        response_type="Yes|No|Partial|Not Applicable",
        is_universal=True,
    )

    db_session.add_all([
        domain_general,
        domain_retail,
        dept,
        cluster,
        category_security,
        category_tech,
        use_case,
        weight_security,
        weight_tech,
        q1,
        q2,
        q3,
    ])
    await db_session.commit()

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
    test_user = User(email="test@example.com", hashed_password="password123", email_verified=True)
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
    test_user = User(email="user@example.com", hashed_password="password123", email_verified=True)
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
    await _seed_question_graph(db_session)

    # Setup user and login
    test_user = User(email="tester@example.com", hashed_password="password123", email_verified=True)
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
    
    assert len(questions) > 0
    assert all(q.get("industry") in ("Retail", "General", None) for q in questions)

@pytest.mark.asyncio
async def test_get_questions_mixed_inventory(client: AsyncClient, db_session):
    await _seed_question_graph(db_session)
    
    # Setup user and login
    test_user = User(email="tester2@example.com", hashed_password="password123", email_verified=True)
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
    assert any(q.get("component_group") == "agents_and_agent_orchestration" for q in questions)

@pytest.mark.asyncio
async def test_get_assessment(client: AsyncClient, db_session):
    # Setup user and login
    test_user = User(email="sync@example.com", hashed_password="password123", email_verified=True)
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

