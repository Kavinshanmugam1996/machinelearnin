# Use the official Python lightweight image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy dependency list and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, frontend and data files
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY Data/ ./Data/

# Set working directory to backend where main.py lives
WORKDIR /app/backend

# Use dedicated writable snapshot path and drop root privileges
ENV ASSESSMENTS_DIR=/app/Assessments
RUN mkdir -p /app/Assessments && adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser

# Expose the port (default 3000, but can be overridden by cloud providers)
ENV PORT=3000
EXPOSE $PORT

# Command to run migrations then start the production server
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT"]
