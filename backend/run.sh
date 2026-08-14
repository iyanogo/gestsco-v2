#!/bin/bash

# Script de démarrage du serveur de développement

# Activer l'environnement virtuel Poetry
if command -v poetry &> /dev/null; then
    echo "Activation de l'environnement Poetry..."
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
else
    # Fallback vers venv classique
    if [ -d "venv" ]; then
        echo "Activation de l'environnement virtuel..."
        source venv/bin/activate
    fi
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
fi
