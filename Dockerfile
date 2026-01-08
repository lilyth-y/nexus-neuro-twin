FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for caching
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY src/backend/ .

# Expose port
EXPOSE 8080

# Cloud Run uses PORT env variable
ENV PORT=8080

# Run the server
CMD ["sh", "-c", "uvicorn api_server:app --host 0.0.0.0 --port ${PORT}"]
