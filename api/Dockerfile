FROM python:3.12-alpine AS base

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── dev stage ──────────────────────────────────
FROM base AS dev

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

COPY . .

ENV FLASK_APP=run.py
ENV FLASK_ENV=development
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

# ── prod stage ─────────────────────────────────
FROM base AS prod

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

COPY . .

ENV FLASK_APP=run.py
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["sh", "-c", "gunicorn -w 4 -b 0.0.0.0:${PORT:-8080} run:app"]
