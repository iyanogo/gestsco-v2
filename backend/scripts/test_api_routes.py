"""
Script pour tester le chargement des routes API
"""

from app.api.v1.api import api_router
print("API routes loaded successfully!")
print(f"Number of routes: {len(api_router.routes)}")
