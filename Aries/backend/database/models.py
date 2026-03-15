from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    qid = Column(String, unique=True, index=True, nullable=False)
    text = Column(Text, nullable=False)
    cluster = Column(String)
    component_group = Column(String, index=True)
    industry = Column(String, index=True)
    is_universal = Column(Boolean, default=False)
    department = Column(String, index=True)
    options = Column(JSON) # List of strings

    risks = relationship("Risk", back_populates="question", cascade="all, delete-orphan")

class QuestionMapper(Base):
    __tablename__ = "question_mapper"
    id = Column(Integer, primary_key=True, index=True)
    use_case = Column(String, unique=True, index=True, nullable=False)
    component_groups = Column(Text) # Comma-separated or JSON list

class Risk(Base):
    __tablename__ = "risks"
    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(String, index=True)
    description = Column(Text)
    question_id = Column(Integer, ForeignKey("questions.id"))
    
    question = relationship("Question", back_populates="risks")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, index=True, nullable=False)
    name = Column(String)
    owner_email = Column(String, index=True)
    profile = Column(JSON) # Company profile details
    answers = Column(JSON) # Map of qid to answer
    current_index = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    
    __table_args__ = (UniqueConstraint('client_id', 'owner_email', name='unique_client_per_user'),)
