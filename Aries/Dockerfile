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

# Expose the port the app runs on
EXPOSE 3000

# Command to run the production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
