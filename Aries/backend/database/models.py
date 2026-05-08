from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, UniqueConstraint, Numeric, DateTime
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)


class Domain(Base):
    __tablename__ = "domains"
    id = Column("domain_id", Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)


class Department(Base):
    __tablename__ = "departments"
    id = Column("dept_id", Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)


class Cluster(Base):
    __tablename__ = "clusters"
    id = Column("cluster_id", Integer, primary_key=True, index=True)
    code = Column(Integer, nullable=False)
    name = Column(String, unique=True, nullable=False)


class Category(Base):
    __tablename__ = "categories"
    id = Column("category_id", Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    question_count = Column(Integer, default=0)

class Question(Base):
    __tablename__ = "questions"
    id = Column("question_id", Integer, primary_key=True, index=True)
    qid_code = Column(String, unique=True, index=True, nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.domain_id"))
    dept_id = Column(Integer, ForeignKey("departments.dept_id"))
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    cluster_id = Column(Integer, ForeignKey("clusters.cluster_id"))
    question_text = Column(Text, nullable=False)
    response_type = Column(Text)
    trigger_points = Column(Text)
    is_universal = Column(Boolean, default=False)

    risks = relationship("Risk", back_populates="question", cascade="all, delete-orphan")
    domain = relationship("Domain")
    department_rel = relationship("Department")
    category = relationship("Category")
    cluster_rel = relationship("Cluster")

    @property
    def qid(self):
        return self.qid_code

    @property
    def text(self):
        return self.question_text

    @property
    def cluster(self):
        return self.cluster_rel.name if self.cluster_rel else None

    @property
    def component_group(self):
        return self.category.slug if self.category else None

    @property
    def industry(self):
        return self.domain.name if self.domain else None

    @property
    def department(self):
        return self.department_rel.name if self.department_rel else None

    @property
    def options(self):
        if not self.response_type:
            return []
        return [opt.strip() for opt in self.response_type.split("|") if opt.strip()]

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
    question_id = Column(Integer, ForeignKey("questions.question_id"))
    
    question = relationship("Question", back_populates="risks")


class UseCase(Base):
    __tablename__ = "use_cases"
    id = Column("use_case_id", Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)


class UseCaseCategoryWeight(Base):
    __tablename__ = "use_case_category_weights"
    id = Column("weight_id", Integer, primary_key=True, index=True)
    use_case_id = Column(Integer, ForeignKey("use_cases.use_case_id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False)
    weight = Column(Numeric(6, 2), nullable=False)

    use_case = relationship("UseCase")
    category = relationship("Category")

    __table_args__ = (UniqueConstraint('use_case_id', 'category_id', name='uq_use_case_category'),)

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
