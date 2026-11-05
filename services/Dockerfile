FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

COPY services/api/requirements.txt ./requirements.txt

RUN uv pip install --system -r requirements.txt

COPY services/api ./services/api
COPY services-aut/api ./services-aut/api
COPY packages ./packages

EXPOSE 8000

CMD ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]