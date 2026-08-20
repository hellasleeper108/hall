FROM python:3.12-alpine
WORKDIR /app
COPY corpus.py server.py ./
COPY data ./data
COPY public ./public
ENV HALL_HOST=0.0.0.0
ENV HALL_PORT=1995
EXPOSE 1995
CMD ["python3", "server.py"]
