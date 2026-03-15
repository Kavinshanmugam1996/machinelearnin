# Use the official Python lightweight image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy dependency list and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Ensure the Assessments directory exists and has correct permissions
RUN mkdir -p Assessments && chmod 777 Assessments

# Expose the port (default 3000, but can be overridden by cloud providers)
ENV PORT=3000
EXPOSE $PORT

# Command to run the production server
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
