FROM python:3.10-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir flask pillow gunicorn

EXPOSE 3100

CMD ["gunicorn", "-b", "0.0.0.0:3100", "app:app"]