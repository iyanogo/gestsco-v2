#!/usr/bin/env python
"""Script standalone pour initialiser la base de données."""

import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.init_db import init


if __name__ == "__main__":
    print("=" * 50)
    print("Initialisation de la base de données GestSco")
    print("=" * 50)
    init()
    print("=" * 50)
    print("Terminé!")
