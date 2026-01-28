# Gemini Code Assistant Context

This document provides a comprehensive overview of the Niha Carbon Platform, its architecture, and development conventions to assist the Gemini code assistant.

## Project Overview

The Niha Carbon Platform is a modern carbon trading platform for EU ETS (EUA) and Chinese carbon allowances (CEA). It features real-time trading, a T+3 settlement system, and comprehensive market operations.

The project is a monorepo containing a frontend application and a backend API.

*   **Backend:** A FastAPI application that provides a RESTful API for the frontend. It handles user authentication, trading logic, and the settlement process. It uses a PostgreSQL database for data storage and Redis for caching and session management.
*   **Frontend:** A React application built with Vite that provides the user interface for the trading platform. It uses TypeScript for type safety and Tailwind CSS for styling.

## Architecture

The project is organized into two main directories: `backend` and `frontend`.

```
Niha/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Business logic
│   │   ├── core/            # Core configuration
│   │   └── tests/           # Test suite
│   └── alembic/             # Database migrations
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/          # Zustand stores
│   │   └── styles/
│   └── docs/
└── docs/                    # Project documentation
```

### Backend

*   **Framework:** FastAPI
*   **Database:** PostgreSQL with SQLAlchemy ORM and Alembic for migrations.
*   **Authentication:** JWT-based authentication.
*   **Key Dependencies:**
    *   `fastapi`: Web framework
    *   `sqlalchemy`: ORM
    *   `alembic`: Database migrations
    *   `redis`: Caching
    *   `resend`: Email notifications
    *   `httpx`: Web scraping for prices
    *   `pytest`: Testing

### Frontend

*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand
*   **Key Dependencies:**
    *   `react` / `react-dom`
    *   `react-router-dom`: Routing
    *   `axios`: HTTP client
    *   `zustand`: State management
    *   `vitest`: Testing

## Building and Running

The project is containerized using Docker and managed with Docker Compose.

### Quick Start

1.  **Set up environment variables:**
    ```bash
    cp backend/.env.example backend/.env
    # Edit backend/.env with your configuration
    ```

2.  **Start all services:**
    ```bash
    docker-compose up -d
    ```

3.  **Run database migrations:**
    ```bash
    docker-compose exec backend alembic upgrade head
    ```

### Development Scripts

*   `./rebuild.sh`: A comprehensive script that stops, cleans, and rebuilds the Docker containers.
*   `./restart.sh`: A simpler script that restarts the containers without rebuilding them.

### Accessing the Application

*   **Frontend:** http://localhost:5173
*   **Backend API:** http://localhost:8000
*   **API Documentation:** http://localhost:8000/docs

## Development Conventions

### Testing

*   **Backend:** Tests are written with `pytest` and can be run with:
    ```bash
    docker-compose exec backend pytest
    ```
*   **Frontend:** Tests are written with `vitest` and can be run with:
    ```bash
    cd frontend
    npm test
    ```

### Linting

*   **Frontend:** ESLint is used for linting. The configuration is in `.eslintrc.cjs` and can be run with:
    ```bash
    cd frontend
    npm run lint
    ```

### Code Style

The project uses standard conventions for Python/FastAPI and TypeScript/React. Adhere to the existing code style when making changes.
