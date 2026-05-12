from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Dict, Any, Optional
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

class UserBase(BaseModel):
    email: EmailStr

class UserLogin(UserBase):
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class MessageResponse(BaseModel):
    message: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class QuestionBase(BaseModel):
    qid: str
    text: str
    cluster: Optional[str] = None
    component_group: Optional[str] = Field(None, alias="component_group")
    industry: Optional[str] = None
    is_universal: bool = Field(False, alias="is_universal")
    department: Optional[str] = None
    options: List[str] = []

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class InventoryItem(BaseModel):
    description: str
    useCase: str

class QuestionRequest(BaseModel):
    use_cases: List[str] = []
    industry: Optional[str] = None
    # Legacy support: accept old inventory format and extract use cases
    inventory: Optional[List[InventoryItem]] = None

class ComponentRequest(BaseModel):
    use_cases: List[str]

class ComponentResponse(BaseModel):
    component_groups: List[str]


class DepartmentProgressItem(BaseModel):
    department: str
    answered: int
    total: int
    progress: int


class DepartmentProgressResponse(BaseModel):
    departments: List[DepartmentProgressItem]
    all_departments_complete: bool

class AssessmentBase(BaseModel):
    id: str = Field(..., alias="id")
    name: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None
    answers: Optional[Dict[str, str]] = None
    currentQuestionIndex: int = Field(0, alias="currentQuestionIndex")
    totalQuestions: int = Field(0, alias="totalQuestions")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class ClientRead(BaseModel):
    id: str
    name: str
    progress: int = 0
    totalQuestions: int = Field(0, alias="totalQuestions")

    model_config = ConfigDict(from_attributes=True)

class SaveResponse(BaseModel):
    status: str
    message: Optional[str] = None
