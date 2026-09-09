"""Script d'initialisation des templates de documents par défaut"""

TEMPLATES_DEFAUT = [
    {
        "code": "BULLETIN_NOTES",
        "libelle": "Bulletin de notes",
        "type_document": "bulletin",
        "description": "Template pour les bulletins de notes semestriels",
        "format_papier": "A4",
        "orientation": "portrait",
        "template_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bulletin de Notes</title>
</head>
<body>
    <div class="header">
        <img src="{{ logo_url }}" alt="Logo" class="logo">
        <h1>{{ nom_etablissement }}</h1>
        <p>{{ adresse_etablissement }}</p>
    </div>
    
    <h2 class="title">BULLETIN DE NOTES</h2>
    <p class="subtitle">{{ annee_academique }} - {{ semestre }}</p>
    
    <div class="student-info">
        <p><strong>Matricule:</strong> {{ matricule }}</p>
        <p><strong>Nom et Prénom:</strong> {{ nom_complet }}</p>
        <p><strong>Filière:</strong> {{ filiere }}</p>
        <p><strong>Niveau:</strong> {{ niveau }}</p>
    </div>
    
    <table class="grades-table">
        <thead>
            <tr>
                <th>Matière</th>
                <th>Coefficient</th>
                <th>Note</th>
                <th>Crédits</th>
            </tr>
        </thead>
        <tbody>
            {{ tableau_notes }}
        </tbody>
    </table>
    
    <div class="summary">
        <p><strong>Moyenne Générale:</strong> {{ moyenne_generale }}/20</p>
        <p><strong>Mention:</strong> {{ mention }}</p>
        <p><strong>Crédits Obtenus:</strong> {{ credits_obtenus }}/{{ credits_total }}</p>
        <p><strong>Rang:</strong> {{ rang }}</p>
    </div>
    
    <div class="footer">
        <p>Fait à {{ ville }}, le {{ date_jour }}</p>
        <p class="signature">Le Directeur des Études</p>
    </div>
</body>
</html>
""",
        "template_css": """
body { font-family: Arial, sans-serif; margin: 20px; }
.header { text-align: center; margin-bottom: 20px; }
.logo { max-height: 80px; }
.title { text-align: center; font-size: 18px; margin: 20px 0 5px; }
.subtitle { text-align: center; font-size: 14px; margin-bottom: 20px; }
.student-info { margin: 20px 0; padding: 10px; background: #f5f5f5; }
.grades-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.grades-table th, .grades-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
.grades-table th { background: #1976d2; color: white; }
.summary { margin: 20px 0; padding: 10px; background: #e3f2fd; }
.footer { margin-top: 40px; text-align: right; }
.signature { margin-top: 50px; }
""",
        "variables_disponibles": '["logo_url", "nom_etablissement", "adresse_etablissement", "annee_academique", "semestre", "matricule", "nom_complet", "filiere", "niveau", "tableau_notes", "moyenne_generale", "mention", "credits_obtenus", "credits_total", "rang", "ville", "date_jour"]',
        "est_systeme_defaut": True
    },
    {
        "code": "ATTESTATION_INSCRIPTION",
        "libelle": "Attestation d'inscription",
        "type_document": "attestation",
        "description": "Template pour les attestations d'inscription",
        "format_papier": "A4",
        "orientation": "portrait",
        "template_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Attestation d'Inscription</title>
</head>
<body>
    <div class="header">
        <img src="{{ logo_url }}" alt="Logo" class="logo">
        <h1>{{ nom_etablissement }}</h1>
        <p>{{ adresse_etablissement }}</p>
        <p>Tél: {{ telephone_etablissement }} | Email: {{ email_etablissement }}</p>
    </div>
    
    <h2 class="title">ATTESTATION D'INSCRIPTION</h2>
    <p class="reference">N° {{ numero_attestation }}</p>
    
    <div class="content">
        <p>Le Directeur de l'{{ nom_etablissement }} atteste que:</p>
        
        <p class="student-name">{{ civilite }} {{ nom_complet }}</p>
        
        <p>Né(e) le {{ date_naissance }} à {{ lieu_naissance }}</p>
        
        <p>Est régulièrement inscrit(e) au sein de notre établissement pour l'année académique {{ annee_academique }} en:</p>
        
        <ul>
            <li><strong>Filière:</strong> {{ filiere }}</li>
            <li><strong>Niveau:</strong> {{ niveau }}</li>
            <li><strong>Matricule:</strong> {{ matricule }}</li>
        </ul>
        
        <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>
    </div>
    
    <div class="footer">
        <p>Fait à {{ ville }}, le {{ date_jour }}</p>
        <p class="signature">Le Directeur</p>
        <p class="stamp">[Cachet et Signature]</p>
    </div>
</body>
</html>
""",
        "template_css": """
body { font-family: 'Times New Roman', serif; margin: 40px; }
.header { text-align: center; margin-bottom: 30px; }
.logo { max-height: 80px; }
.title { text-align: center; font-size: 20px; text-decoration: underline; margin: 30px 0 10px; }
.reference { text-align: center; font-style: italic; margin-bottom: 30px; }
.content { line-height: 1.8; text-align: justify; }
.student-name { font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; }
.footer { margin-top: 50px; text-align: right; }
.signature { margin-top: 40px; font-weight: bold; }
.stamp { margin-top: 60px; font-style: italic; }
""",
        "variables_disponibles": '["logo_url", "nom_etablissement", "adresse_etablissement", "telephone_etablissement", "email_etablissement", "numero_attestation", "civilite", "nom_complet", "date_naissance", "lieu_naissance", "annee_academique", "filiere", "niveau", "matricule", "ville", "date_jour"]',
        "est_systeme_defaut": True
    },
    {
        "code": "FACTURE",
        "libelle": "Facture",
        "type_document": "facture",
        "description": "Template pour les factures",
        "format_papier": "A4",
        "orientation": "portrait",
        "template_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture</title>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <img src="{{ logo_url }}" alt="Logo" class="logo">
            <h1>{{ nom_etablissement }}</h1>
            <p>{{ adresse_etablissement }}</p>
            <p>Tél: {{ telephone_etablissement }}</p>
        </div>
    </div>
    
    <div class="invoice-header">
        <h2>FACTURE</h2>
        <p><strong>N°:</strong> {{ numero_facture }}</p>
        <p><strong>Date:</strong> {{ date_facture }}</p>
        <p><strong>Échéance:</strong> {{ date_echeance }}</p>
    </div>
    
    <div class="client-info">
        <h3>Facturé à:</h3>
        <p><strong>{{ nom_complet }}</strong></p>
        <p>Matricule: {{ matricule }}</p>
        <p>{{ filiere }} - {{ niveau }}</p>
    </div>
    
    <table class="invoice-table">
        <thead>
            <tr>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody>
            {{ lignes_facture }}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="text-right"><strong>Total HT:</strong></td>
                <td>{{ montant_ht }} {{ devise }}</td>
            </tr>
            <tr>
                <td colspan="3" class="text-right"><strong>TVA ({{ taux_tva }}%):</strong></td>
                <td>{{ montant_tva }} {{ devise }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="3" class="text-right"><strong>TOTAL TTC:</strong></td>
                <td><strong>{{ montant_total }} {{ devise }}</strong></td>
            </tr>
        </tfoot>
    </table>
    
    <div class="payment-info">
        <h3>Informations de paiement</h3>
        <p><strong>Montant payé:</strong> {{ montant_paye }} {{ devise }}</p>
        <p><strong>Reste à payer:</strong> {{ montant_restant }} {{ devise }}</p>
    </div>
    
    <div class="footer">
        <p>{{ nom_etablissement }} - {{ adresse_etablissement }}</p>
    </div>
</body>
</html>
""",
        "template_css": """
body { font-family: Arial, sans-serif; margin: 20px; }
.header { margin-bottom: 30px; }
.logo { max-height: 60px; }
.invoice-header { background: #1976d2; color: white; padding: 15px; margin-bottom: 20px; }
.invoice-header h2 { margin: 0 0 10px; }
.client-info { margin-bottom: 20px; padding: 15px; background: #f5f5f5; }
.invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 10px; }
.invoice-table th { background: #f5f5f5; }
.text-right { text-align: right; }
.total-row { background: #e3f2fd; }
.payment-info { margin: 20px 0; padding: 15px; border: 1px solid #1976d2; }
.footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
""",
        "variables_disponibles": '["logo_url", "nom_etablissement", "adresse_etablissement", "telephone_etablissement", "numero_facture", "date_facture", "date_echeance", "nom_complet", "matricule", "filiere", "niveau", "lignes_facture", "montant_ht", "taux_tva", "montant_tva", "montant_total", "devise", "montant_paye", "montant_restant"]',
        "est_systeme_defaut": True
    },
    {
        "code": "RECU_PAIEMENT",
        "libelle": "Reçu de paiement",
        "type_document": "recu",
        "description": "Template pour les reçus de paiement",
        "format_papier": "A5",
        "orientation": "portrait",
        "template_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reçu de Paiement</title>
</head>
<body>
    <div class="header">
        <img src="{{ logo_url }}" alt="Logo" class="logo">
        <h1>{{ nom_etablissement }}</h1>
    </div>
    
    <h2 class="title">REÇU DE PAIEMENT</h2>
    <p class="receipt-number">N° {{ numero_recu }}</p>
    
    <div class="content">
        <p>Reçu de: <strong>{{ nom_complet }}</strong></p>
        <p>Matricule: {{ matricule }}</p>
        <p>La somme de: <strong>{{ montant_lettres }}</strong></p>
        <p class="amount">{{ montant }} {{ devise }}</p>
        <p>Mode de paiement: {{ mode_paiement }}</p>
        <p>Motif: {{ motif }}</p>
        <p>Référence facture: {{ numero_facture }}</p>
    </div>
    
    <div class="footer">
        <p>{{ ville }}, le {{ date_paiement }}</p>
        <p class="signature">Le Caissier</p>
    </div>
</body>
</html>
""",
        "template_css": """
body { font-family: Arial, sans-serif; margin: 15px; font-size: 12px; }
.header { text-align: center; margin-bottom: 15px; }
.logo { max-height: 50px; }
.title { text-align: center; font-size: 16px; margin: 15px 0 5px; }
.receipt-number { text-align: center; font-weight: bold; margin-bottom: 15px; }
.content { margin: 15px 0; }
.amount { font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0; padding: 10px; background: #e3f2fd; }
.footer { margin-top: 30px; text-align: right; }
.signature { margin-top: 30px; }
""",
        "variables_disponibles": '["logo_url", "nom_etablissement", "numero_recu", "nom_complet", "matricule", "montant_lettres", "montant", "devise", "mode_paiement", "motif", "numero_facture", "ville", "date_paiement"]',
        "est_systeme_defaut": True
    }
]


def init_templates(db):
    """Initialise les templates de documents par défaut"""
    from app.models.template_document import TemplateDocument
    
    count = 0
    for template_data in TEMPLATES_DEFAUT:
        existing = db.query(TemplateDocument).filter(
            TemplateDocument.code == template_data["code"]
        ).first()
        
        if not existing:
            template = TemplateDocument(**template_data)
            db.add(template)
            count += 1
    
    db.commit()
    return count
