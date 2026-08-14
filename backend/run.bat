@echo off
REM Script de démarrage du serveur de développement (Windows)

where poetry >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Activation de l'environnement Poetry...
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) else (
    if exist venv\Scripts\activate.bat (
        echo Activation de l'environnement virtuel...
        call venv\Scripts\activate.bat
    )
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
)
