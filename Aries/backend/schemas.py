from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Dict, Any, Optional
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

class UserBase(BaseModel):
    email: EmailStr

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QuestionBase(BaseModel):
    qid: str
    text: str
    cluster: Optional[str] = None
    component_group: Optional[str] = Field(None, alias="component_group")
    industry: Optional[str] = None
    is_universal: bool = Field(False, alias="is_universal")
    options: List[str] = []

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class InventoryItem(BaseModel):
    description: str
    useCase: str

class QuestionRequest(BaseModel):
    inventory: List[InventoryItem]
    industry: Optional[str] = None

class AssessmentBase(BaseModel):
    id: str = Field(..., alias="id")
    name: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None
    answers: Optional[Dict[str, str]] = None
    currentQuestionIndex: int = Field(0, alias="currentQuestionIndex")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class ClientRead(BaseModel):
    id: str
    name: str

    model_config = ConfigDict(from_attributes=True)

class SaveResponse(BaseModel):
    status: str
    message: Optional[str] = None
