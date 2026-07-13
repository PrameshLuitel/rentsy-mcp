FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir .

COPY src/ src/

ENV PYTHONUNBUFFERED=1
ENV PORT=10000

CMD ["python", "-m", "src.app"]
