"""Script d'initialisation des paramètres système par défaut"""

PARAMETRES_DEFAUT = [
    # Catégorie: general
    {
        "categorie": "general",
        "cle": "nom_application",
        "valeur": "GestSco",
        "type_valeur": "string",
        "libelle": "Nom de l'application",
        "description": "Nom affiché dans l'interface",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "general",
        "cle": "version_application",
        "valeur": "2.0.0",
        "type_valeur": "string",
        "libelle": "Version de l'application",
        "description": "Version actuelle du système",
        "est_modifiable": False,
        "est_visible": True,
        "ordre_affichage": 2
    },
    {
        "categorie": "general",
        "cle": "langue_defaut",
        "valeur": "fr",
        "type_valeur": "string",
        "libelle": "Langue par défaut",
        "description": "Langue par défaut de l'interface",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 3
    },
    
    # Catégorie: academique
    {
        "categorie": "academique",
        "cle": "systeme_notation",
        "valeur": "LMD",
        "type_valeur": "string",
        "libelle": "Système de notation",
        "description": "Système de notation utilisé (LMD, Classique)",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "academique",
        "cle": "note_maximale",
        "valeur": "20",
        "type_valeur": "float",
        "libelle": "Note maximale",
        "description": "Note maximale possible",
        "unite": "/20",
        "valeur_defaut": "20",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 2
    },
    {
        "categorie": "academique",
        "cle": "note_passage",
        "valeur": "10",
        "type_valeur": "float",
        "libelle": "Note de passage",
        "description": "Note minimale pour valider une matière",
        "unite": "/20",
        "valeur_defaut": "10",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 3
    },
    {
        "categorie": "academique",
        "cle": "precision_notes",
        "valeur": "2",
        "type_valeur": "integer",
        "libelle": "Précision des notes",
        "description": "Nombre de décimales pour les notes",
        "valeur_defaut": "2",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 4
    },
    {
        "categorie": "academique",
        "cle": "credits_par_annee",
        "valeur": "60",
        "type_valeur": "integer",
        "libelle": "Crédits par année",
        "description": "Nombre de crédits ECTS par année",
        "unite": "crédits",
        "valeur_defaut": "60",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 5
    },
    {
        "categorie": "academique",
        "cle": "credits_par_semestre",
        "valeur": "30",
        "type_valeur": "integer",
        "libelle": "Crédits par semestre",
        "description": "Nombre de crédits ECTS par semestre",
        "unite": "crédits",
        "valeur_defaut": "30",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 6
    },
    {
        "categorie": "academique",
        "cle": "compensation_autorisee",
        "valeur": "true",
        "type_valeur": "boolean",
        "libelle": "Compensation autorisée",
        "description": "Autoriser la compensation entre matières",
        "valeur_defaut": "true",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 7
    },
    {
        "categorie": "academique",
        "cle": "seuil_compensation",
        "valeur": "8",
        "type_valeur": "float",
        "libelle": "Seuil de compensation",
        "description": "Note minimale pour bénéficier de la compensation",
        "unite": "/20",
        "valeur_defaut": "8",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 8
    },
    {
        "categorie": "academique",
        "cle": "note_eliminatoire",
        "valeur": "5",
        "type_valeur": "float",
        "libelle": "Note éliminatoire",
        "description": "Note en dessous de laquelle la compensation est impossible",
        "unite": "/20",
        "valeur_defaut": "5",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 9
    },
    
    # Catégorie: financier
    {
        "categorie": "financier",
        "cle": "devise",
        "valeur": "XOF",
        "type_valeur": "string",
        "libelle": "Devise",
        "description": "Devise utilisée pour les transactions",
        "valeur_defaut": "XOF",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "financier",
        "cle": "symbole_devise",
        "valeur": "FCFA",
        "type_valeur": "string",
        "libelle": "Symbole devise",
        "description": "Symbole affiché pour la devise",
        "valeur_defaut": "FCFA",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 2
    },
    {
        "categorie": "financier",
        "cle": "tva_applicable",
        "valeur": "false",
        "type_valeur": "boolean",
        "libelle": "TVA applicable",
        "description": "Appliquer la TVA sur les frais",
        "valeur_defaut": "false",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 3
    },
    {
        "categorie": "financier",
        "cle": "taux_tva",
        "valeur": "18",
        "type_valeur": "float",
        "libelle": "Taux TVA",
        "description": "Taux de TVA en pourcentage",
        "unite": "%",
        "valeur_defaut": "18",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 4
    },
    {
        "categorie": "financier",
        "cle": "penalite_retard",
        "valeur": "5",
        "type_valeur": "float",
        "libelle": "Pénalité de retard",
        "description": "Pourcentage de pénalité pour paiement en retard",
        "unite": "%",
        "valeur_defaut": "5",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 5
    },
    
    # Catégorie: inscription
    {
        "categorie": "inscription",
        "cle": "inscription_en_ligne",
        "valeur": "true",
        "type_valeur": "boolean",
        "libelle": "Inscription en ligne",
        "description": "Autoriser les inscriptions en ligne",
        "valeur_defaut": "true",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "inscription",
        "cle": "validation_manuelle",
        "valeur": "true",
        "type_valeur": "boolean",
        "libelle": "Validation manuelle",
        "description": "Validation manuelle des dossiers d'inscription",
        "valeur_defaut": "true",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 2
    },
    {
        "categorie": "inscription",
        "cle": "frais_dossier_defaut",
        "valeur": "5000",
        "type_valeur": "integer",
        "libelle": "Frais de dossier par défaut",
        "description": "Montant par défaut des frais de dossier",
        "unite": "FCFA",
        "valeur_defaut": "5000",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 3
    },
    
    # Catégorie: presence
    {
        "categorie": "presence",
        "cle": "taux_presence_minimum",
        "valeur": "75",
        "type_valeur": "float",
        "libelle": "Taux de présence minimum",
        "description": "Taux de présence minimum requis",
        "unite": "%",
        "valeur_defaut": "75",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "presence",
        "cle": "sanction_absence_excessive",
        "valeur": "exclusion_examen",
        "type_valeur": "string",
        "libelle": "Sanction absence excessive",
        "description": "Sanction en cas d'absences excessives",
        "valeur_defaut": "exclusion_examen",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 2
    },
    
    # Catégorie: communication
    {
        "categorie": "communication",
        "cle": "email_actif",
        "valeur": "true",
        "type_valeur": "boolean",
        "libelle": "Email actif",
        "description": "Activer l'envoi d'emails automatiques",
        "valeur_defaut": "true",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "communication",
        "cle": "sms_actif",
        "valeur": "false",
        "type_valeur": "boolean",
        "libelle": "SMS actif",
        "description": "Activer l'envoi de SMS automatiques",
        "valeur_defaut": "false",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 2
    },
    
    # Catégorie: affichage
    {
        "categorie": "affichage",
        "cle": "format_date",
        "valeur": "DD/MM/YYYY",
        "type_valeur": "string",
        "libelle": "Format de date",
        "description": "Format d'affichage des dates",
        "valeur_defaut": "DD/MM/YYYY",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 1
    },
    {
        "categorie": "affichage",
        "cle": "format_heure",
        "valeur": "HH:mm",
        "type_valeur": "string",
        "libelle": "Format d'heure",
        "description": "Format d'affichage des heures",
        "valeur_defaut": "HH:mm",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 2
    },
    {
        "categorie": "affichage",
        "cle": "fuseau_horaire",
        "valeur": "Africa/Ouagadougou",
        "type_valeur": "string",
        "libelle": "Fuseau horaire",
        "description": "Fuseau horaire par défaut",
        "valeur_defaut": "Africa/Ouagadougou",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 3
    },
    {
        "categorie": "affichage",
        "cle": "pagination_defaut",
        "valeur": "20",
        "type_valeur": "integer",
        "libelle": "Pagination par défaut",
        "description": "Nombre d'éléments par page par défaut",
        "valeur_defaut": "20",
        "est_modifiable": True,
        "est_visible": True,
        "ordre_affichage": 4
    },
]


def init_parametres(db):
    """Initialise les paramètres système par défaut"""
    from app.models.parametre_systeme import ParametreSysteme
    
    count = 0
    for param_data in PARAMETRES_DEFAUT:
        existing = db.query(ParametreSysteme).filter(
            ParametreSysteme.cle == param_data["cle"]
        ).first()
        
        if not existing:
            parametre = ParametreSysteme(**param_data)
            db.add(parametre)
            count += 1
    
    db.commit()
    return count
