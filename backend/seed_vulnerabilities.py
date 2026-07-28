from database import SessionLocal, engine, Base
from models import Vulnerability

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing for clean start
db.query(Vulnerability).delete()

vulns = [
    Vulnerability(
        cve_id="CVE-2021-34527",
        description="PrintNightmare: remote code execution in Windows Print Spooler",
        cvss_score=8.8,
        attack_vector="network",
        attack_complexity="low",
        privilege_required="none",
        user_interaction="none",
        mitre_technique_id="T1068",
        preconditions={"access": "remote", "authentication": "none"},
        postconditions={"gain": "SYSTEM", "effect": "code_execution"}
    ),
    Vulnerability(
        cve_id="CVE-2021-36934",
        description="SeriousSAM: local privilege escalation via SAM file access",
        cvss_score=7.8,
        attack_vector="local",
        attack_complexity="low",
        privilege_required="low",
        user_interaction="none",
        mitre_technique_id="T1068",
        preconditions={"access": "user", "privilege": "user"},
        postconditions={"gain": "SYSTEM", "effect": "privilege_escalation"}
    ),
    Vulnerability(
        cve_id="CVE-2022-22965",
        description="Spring4Shell: remote code execution in Spring Framework",
        cvss_score=9.8,
        attack_vector="network",
        attack_complexity="low",
        privilege_required="none",
        user_interaction="none",
        mitre_technique_id="T1190",
        preconditions={"access": "remote"},
        postconditions={"gain": "web_admin", "effect": "code_execution"}
    ),
    Vulnerability(
        cve_id="CVE-2023-23397",
        description="Microsoft Outlook privilege escalation (EoP)",
        cvss_score=9.8,
        attack_vector="network",
        attack_complexity="low",
        privilege_required="none",
        user_interaction="none",
        mitre_technique_id="T1203",
        preconditions={"access": "remote", "user": "john"},
        postconditions={"gain": "user_creds", "effect": "credential_theft"}
    ),
]

db.add_all(vulns)
db.commit()
db.close()
print("Vulnerabilities seeded successfully!")