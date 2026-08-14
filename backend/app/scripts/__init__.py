from app.scripts.init_parametres import init_parametres, PARAMETRES_DEFAUT
from app.scripts.init_baremes import init_baremes, BAREMES_DEFAUT
from app.scripts.init_templates import init_templates, TEMPLATES_DEFAUT
from app.scripts.init_pays import init_pays, PAYS_DEFAUT


def init_all(db):
    """Initialise toutes les données par défaut"""
    results = {
        "parametres": init_parametres(db),
        "baremes": init_baremes(db),
        "templates": init_templates(db),
        "pays": init_pays(db)
    }
    return results


__all__ = [
    "init_parametres",
    "init_baremes", 
    "init_templates",
    "init_pays",
    "init_all",
    "PARAMETRES_DEFAUT",
    "BAREMES_DEFAUT",
    "TEMPLATES_DEFAUT",
    "PAYS_DEFAUT"
]
