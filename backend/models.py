from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, index=True)
    description = Column(String)
    cvss_score = Column(Float)
    attack_vector = Column(String)
    attack_complexity = Column(String)
    privilege_required = Column(String)
    user_interaction = Column(String)
    mitre_technique_id = Column(String, nullable=True)
    preconditions = Column(JSON)
    postconditions = Column(JSON)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(String)
    os = Column(String)
    ip = Column(String)
    subnet = Column(String)
    properties = Column(JSON)

class Edge(Base):
    __tablename__ = "edges"
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("assets.id"))
    target_id = Column(Integer, ForeignKey("assets.id"))
    edge_type = Column(String)
    technique_id = Column(String, nullable=True)
    cost = Column(Float, default=1.0)
    preconditions = Column(JSON)
    postconditions = Column(JSON)
    source = relationship("Asset", foreign_keys=[source_id])
    target = relationship("Asset", foreign_keys=[target_id])