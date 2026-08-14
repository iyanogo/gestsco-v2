from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.repositories.parametre_repository import parametre_repository
from app.repositories.configuration_etablissement_repository import configuration_etablissement_repository


def get_parametre(db: Session, cle: str, defaut: Any = None) -> Any:
    """Récupère la valeur d'un paramètre système"""
    return parametre_repository.get_valeur(db, cle, defaut)


def set_parametre(db: Session, cle: str, valeur: Any, user_id: int) -> bool:
    """Met à jour la valeur d'un paramètre système"""
    result = parametre_repository.set_valeur(db, cle, valeur, user_id)
    return result is not None


def get_configuration_etablissement(db: Session, etablissement_id: int) -> Dict[str, Any]:
    """Récupère la configuration d'un établissement"""
    config = configuration_etablissement_repository.get_active(db, etablissement_id)
    if not config:
        return {}
    
    return {
        "id": config.id,
        "etablissement_id": config.etablissement_id,
        "nom_complet": config.nom_complet,
        "nom_court": config.nom_court,
        "sigle": config.sigle,
        "slogan": config.slogan,
        "logo_url": config.logo_url,
        "banniere_url": config.banniere_url,
        "adresse_complete": config.adresse_complete,
        "ville": config.ville,
        "pays": config.pays,
        "telephone_principal": config.telephone_principal,
        "email_principal": config.email_principal,
        "email_scolarite": config.email_scolarite,
        "site_web": config.site_web,
        "systeme_notation": config.systeme_notation,
        "referentiel": config.referentiel,
        "langue_enseignement": config.langue_enseignement,
        "devise": config.devise,
        "note_minimale": float(config.note_minimale),
        "note_maximale": float(config.note_maximale),
        "note_passage": float(config.note_passage),
        "precision_notes": config.precision_notes,
        "taux_presence_minimum": float(config.taux_presence_minimum),
        "couleur_primaire": config.couleur_primaire,
        "couleur_secondaire": config.couleur_secondaire,
        "theme": config.theme,
        "fuseau_horaire": config.fuseau_horaire,
        "format_date": config.format_date,
        "format_heure": config.format_heure,
    }


def get_configuration_complete(db: Session, etablissement_id: int) -> Dict[str, Any]:
    """Combine parametres_systeme + configuration_etablissement"""
    # Récupérer tous les paramètres système
    parametres = parametre_repository.get_all_parametres(db)
    
    # Récupérer la configuration de l'établissement
    config_etab = get_configuration_etablissement(db, etablissement_id)
    
    # Fusionner les deux
    return {
        "parametres_systeme": parametres,
        "configuration_etablissement": config_etab,
    }


def initialiser_parametres_defaut(db: Session) -> Dict[str, int]:
    """Crée tous les paramètres par défaut du système"""
    count = parametre_repository.initialiser_parametres_defaut(db)
    return {"parametres_crees": count}


def get_parametres_par_categorie(db: Session) -> Dict[str, list]:
    """Retourne les paramètres groupés par catégorie"""
    parametres = parametre_repository.get_all(db)
    result = {}
    for p in parametres:
        if p.categorie not in result:
            result[p.categorie] = []
        result[p.categorie].append({
            "id": p.id,
            "cle": p.cle,
            "valeur": p.valeur,
            "type_valeur": p.type_valeur,
            "libelle": p.libelle,
            "description": p.description,
            "unite": p.unite,
            "valeur_defaut": p.valeur_defaut,
            "est_modifiable": p.est_modifiable,
        })
    return result
