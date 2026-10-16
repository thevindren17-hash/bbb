"""Template-based job ad + interview question generator."""

JD_TEMPLATE = """{title}
{company} — {department}

About the role:
{company} is hiring a {title} to join our {department} team.

Responsibilities:
{responsibilities}

Requirements:
{requirements}

How to apply:
Send your resume to {contact_email}.
"""

INTERVIEW_QUESTION_BANK = {
    "general": [
        "Tell us about yourself and why you're interested in this role.",
        "Describe a time you had to deal with a difficult colleague or situation at work.",
        "Why do you want to work at {company}?",
        "Where do you see yourself in the next 2-3 years?",
        "What is your expected salary range for this role?",
    ],
    "technical": [
        "Walk us through a recent project that best demonstrates your skills for this role.",
        "How do you stay up to date with developments in your field?",
        "Describe a technical problem you solved and how you approached it.",
        "What tools or systems have you used that are relevant to this role?",
    ],
    "management": [
        "Describe your approach to managing a team with mixed performance levels.",
        "Tell us about a time you had to deliver difficult feedback.",
        "How do you prioritize competing deadlines across your team?",
        "Describe how you've handled conflict between team members.",
    ],
}


def generate_job_ad(title, company, department, responsibilities, requirements, contact_email):
    """Build a job ad from a template. responsibilities/requirements may be a
    list of strings or a single string; lists are rendered as bullet points."""

    def _as_bullets(value):
        if isinstance(value, (list, tuple)):
            return "\n".join(f"- {item}" for item in value)
        return value

    return JD_TEMPLATE.format(
        title=title,
        company=company,
        department=department,
        responsibilities=_as_bullets(responsibilities),
        requirements=_as_bullets(requirements),
        contact_email=contact_email,
    )


def generate_interview_questions(role_category="general", n=5, company="the company"):
    """Return up to n interview questions for the given role_category
    ('general', 'technical', or 'management')."""
    bank = INTERVIEW_QUESTION_BANK.get(role_category, INTERVIEW_QUESTION_BANK["general"])
    questions = [q.format(company=company) for q in bank[:n]]
    return questions
