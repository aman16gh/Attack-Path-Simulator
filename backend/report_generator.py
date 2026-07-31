import os
from dotenv import load_dotenv

load_dotenv()

# Attempt to use real Gemini if available, else fallback to simulated report.
USE_REAL_LLM = False  # Set to True after you fix the quota issue

if USE_REAL_LLM:
    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    except ImportError:
        print("google-genai not installed, falling back to dummy report.")
        USE_REAL_LLM = False


def generate_attack_report(path_data: dict) -> str:
    if USE_REAL_LLM:
        return _generate_real_report(path_data)
    else:
        return _generate_dummy_report(path_data)


def _generate_real_report(path_data: dict) -> str:
    path_summary = "\n".join(
        [f"{i+1}. {step['from']} → {step['to']} (technique: {step.get('technique', 'N/A')}, "
         f"cost: {step['cost']}, pre: {step.get('preconditions', {})}, "
         f"post: {step.get('postconditions', {})})"
         for i, step in enumerate(path_data['steps'])]
    )

    prompt = f"""
You are a senior penetration tester and cybersecurity expert.

Given the following attack path inside a corporate network, generate a thorough security report in Markdown format. The report must contain:

1. **Executive Summary** (non-technical, 2-3 sentences explaining the risk to the business in plain language).
2. **Technical Kill Chain** (a table with columns: Step, Attacker Action, MITRE ATT&CK Technique, Affected Systems, Impact).
3. **Detailed Step-by-Step Analysis** (explain each step).
4. **Risk Score** (interpret the score).
5. **Mitigations & Recommendations**.
6. **Conclusion**.

Attack path data:
- Path: {path_data['path']}
- Total cost: {path_data['total_cost']}
- Risk score: {path_data['risk_score']}
- Steps:
{path_summary}
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error generating report: {str(e)}"


def _generate_dummy_report(path_data: dict) -> str:
    """Fallback: create a structured report based on the actual path."""
    path_str = " → ".join(path_data['path'])
    steps_md = ""
    for i, step in enumerate(path_data['steps'], 1):
        technique = step.get('technique') or 'N/A'
        steps_md += f"**Step {i}:** {step['from']} → {step['to']}  \n"
        steps_md += f"- Technique: {technique}  \n"
        steps_md += f"- Cost: {step['cost']}  \n"
        if step.get('preconditions'):
            steps_md += f"- Preconditions: {step['preconditions']}  \n"
        if step.get('postconditions'):
            steps_md += f"- Postconditions: {step['postconditions']}  \n"
        steps_md += "\n"

    risk = path_data['risk_score']
    if risk < 20:
        risk_level = "Low"
    elif risk < 50:
        risk_level = "Medium"
    elif risk < 80:
        risk_level = "High"
    else:
        risk_level = "Critical"

    report = f"""
## Executive Summary

An attack path was identified from **{path_data['path'][0]}** to **{path_data['path'][-1]}** with a total cost of **{path_data['total_cost']}** and a risk score of **{risk}** ({risk_level}).  
The attacker could potentially move laterally through the network, exploiting misconfigurations and vulnerabilities to reach critical assets.

## Technical Kill Chain

| Step | Attacker Action | MITRE ATT&CK | Affected Systems | Impact |
|------|----------------|--------------|------------------|--------|
"""
    for i, step in enumerate(path_data['steps'], 1):
        technique = step.get('technique') or 'N/A'
        report += f"| {i} | {step['from']} → {step['to']} | {technique} | {step['from']}, {step['to']} | Potential compromise |\n"

    report += f"""
## Detailed Step-by-Step Analysis

{steps_md}

## Risk Score Interpretation

The overall risk score is **{risk}**, which is considered **{risk_level}**.  
"""
    if risk_level == "Low":
        report += "The attack path is relatively short and uses low‑impact techniques. However, even a low‑risk path could be a stepping stone for further attacks.\n"
    elif risk_level == "Medium":
        report += "This path poses a moderate threat. It may require the attacker to chain a few techniques, but the impact could be significant if they reach sensitive assets.\n"
    elif risk_level == "High":
        report += "The attack path is high risk. The attacker could potentially gain privileged access to critical systems with relative ease.\n"
    else:
        report += "This is a critical risk path. Immediate remediation is strongly advised.\n"

    report += """
## Mitigations & Recommendations

1. **Network Segmentation** – Restrict unnecessary connectivity between workstations and critical servers.
2. **Patch Management** – Apply all security updates for known vulnerabilities (CVEs).
3. **Privilege Management** – Enforce least privilege; remove local admin rights where possible.
4. **Multi‑Factor Authentication** – Enable MFA for all remote access.
5. **Continuous Monitoring** – Deploy endpoint detection and response (EDR) to spot lateral movement.

## Conclusion

The identified attack path highlights the importance of a layered defense strategy. Even a simple path can be exploited if basic security controls are missing. The recommendations above should be prioritized to reduce the risk.

---
*This report was generated automatically by the Attack Path Simulator.*
"""
    return report