"""Telegram bot, polling-based."""

import logging
import os

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters

from answer_engine import get_answer
from jd_generator import generate_interview_questions, generate_job_ad

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COMPANY_NAME = os.environ.get("COMPANY_NAME", "Star Media Group")

START_TEXT = (
    "Hi! I'm the SMG HR Assistant.\n\n"
    "Ask me a question about company policy or the Employment Act, e.g.:\n"
    "  \"How many annual leave days am I entitled to?\"\n\n"
    "Other commands:\n"
    "/jd <title> ; <department> ; <responsibility1, responsibility2> ; <requirement1, requirement2>\n"
    "/interview <general|technical|management>"
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(START_TEXT)


async def handle_question(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.message.text
    result = get_answer(query, company=COMPANY_NAME)
    await update.message.reply_text(result["answer"])


async def jd_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    raw = update.message.text.partition(" ")[2]
    parts = [p.strip() for p in raw.split(";")]
    if len(parts) != 4:
        await update.message.reply_text(
            "Usage:\n/jd <title> ; <department> ; <responsibility1, responsibility2> ; <requirement1, requirement2>"
        )
        return

    title, department, responsibilities_raw, requirements_raw = parts
    responsibilities = [r.strip() for r in responsibilities_raw.split(",") if r.strip()]
    requirements = [r.strip() for r in requirements_raw.split(",") if r.strip()]

    ad = generate_job_ad(
        title=title,
        company=COMPANY_NAME,
        department=department,
        responsibilities=responsibilities,
        requirements=requirements,
        contact_email=os.environ.get("HR_CONTACT_EMAIL", "hr@example.com"),
    )
    await update.message.reply_text(ad)


async def interview_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    category = update.message.text.partition(" ")[2].strip().lower() or "general"
    questions = generate_interview_questions(role_category=category, company=COMPANY_NAME)
    reply = f"Interview questions ({category}):\n\n" + "\n".join(
        f"{i}. {q}" for i, q in enumerate(questions, 1)
    )
    await update.message.reply_text(reply)


def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("Set the TELEGRAM_BOT_TOKEN environment variable before running the bot.")

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("jd", jd_command))
    app.add_handler(CommandHandler("interview", interview_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_question))

    logger.info("SMG HR Assistant bot starting (polling)...")
    app.run_polling()


if __name__ == "__main__":
    main()
