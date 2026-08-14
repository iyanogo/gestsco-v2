"""Script d'initialisation des barèmes de notation par défaut"""

BAREMES_DEFAUT = [
    {
        "code": "BAREME_LMD_20",
        "libelle": "Barème LMD sur 20",
        "description": "Barème de notation standard LMD sur 20 points",
        "note_min": 0,
        "note_max": 20,
        "est_systeme_defaut": True,
        "mentions": [
            {
                "code": "TB",
                "libelle": "Très Bien",
                "note_min": 16,
                "note_max": 20,
                "couleur": "#4CAF50",
                "ordre": 1,
                "description": "Excellente performance"
            },
            {
                "code": "B",
                "libelle": "Bien",
                "note_min": 14,
                "note_max": 15.99,
                "couleur": "#8BC34A",
                "ordre": 2,
                "description": "Très bonne performance"
            },
            {
                "code": "AB",
                "libelle": "Assez Bien",
                "note_min": 12,
                "note_max": 13.99,
                "couleur": "#CDDC39",
                "ordre": 3,
                "description": "Bonne performance"
            },
            {
                "code": "P",
                "libelle": "Passable",
                "note_min": 10,
                "note_max": 11.99,
                "couleur": "#FFC107",
                "ordre": 4,
                "description": "Performance acceptable"
            },
            {
                "code": "I",
                "libelle": "Insuffisant",
                "note_min": 0,
                "note_max": 9.99,
                "couleur": "#F44336",
                "ordre": 5,
                "description": "Performance insuffisante"
            }
        ]
    },
    {
        "code": "BAREME_100",
        "libelle": "Barème sur 100",
        "description": "Barème de notation sur 100 points",
        "note_min": 0,
        "note_max": 100,
        "est_systeme_defaut": False,
        "mentions": [
            {
                "code": "A",
                "libelle": "Excellent",
                "note_min": 90,
                "note_max": 100,
                "couleur": "#4CAF50",
                "ordre": 1,
                "description": "Excellente performance"
            },
            {
                "code": "B",
                "libelle": "Très Bien",
                "note_min": 80,
                "note_max": 89.99,
                "couleur": "#8BC34A",
                "ordre": 2,
                "description": "Très bonne performance"
            },
            {
                "code": "C",
                "libelle": "Bien",
                "note_min": 70,
                "note_max": 79.99,
                "couleur": "#CDDC39",
                "ordre": 3,
                "description": "Bonne performance"
            },
            {
                "code": "D",
                "libelle": "Passable",
                "note_min": 50,
                "note_max": 69.99,
                "couleur": "#FFC107",
                "ordre": 4,
                "description": "Performance acceptable"
            },
            {
                "code": "F",
                "libelle": "Échec",
                "note_min": 0,
                "note_max": 49.99,
                "couleur": "#F44336",
                "ordre": 5,
                "description": "Performance insuffisante"
            }
        ]
    }
]


def init_baremes(db):
    """Initialise les barèmes de notation par défaut"""
    from app.models.bareme_notation import BaremeNotation
    from app.models.mention_notation import MentionNotation
    from decimal import Decimal
    
    count = 0
    for bareme_data in BAREMES_DEFAUT:
        existing = db.query(BaremeNotation).filter(
            BaremeNotation.code == bareme_data["code"]
        ).first()
        
        if not existing:
            mentions_data = bareme_data.pop("mentions", [])
            
            bareme = BaremeNotation(
                code=bareme_data["code"],
                libelle=bareme_data["libelle"],
                description=bareme_data["description"],
                note_min=Decimal(str(bareme_data["note_min"])),
                note_max=Decimal(str(bareme_data["note_max"])),
                est_systeme_defaut=bareme_data["est_systeme_defaut"]
            )
            db.add(bareme)
            db.flush()
            
            for mention_data in mentions_data:
                mention = MentionNotation(
                    bareme_id=bareme.id,
                    code=mention_data["code"],
                    libelle=mention_data["libelle"],
                    note_min=Decimal(str(mention_data["note_min"])),
                    note_max=Decimal(str(mention_data["note_max"])),
                    couleur=mention_data.get("couleur"),
                    ordre=mention_data.get("ordre", 0),
                    description=mention_data.get("description")
                )
                db.add(mention)
            
            count += 1
    
    db.commit()
    return count
