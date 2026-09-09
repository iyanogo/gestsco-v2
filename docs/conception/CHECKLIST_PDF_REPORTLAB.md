# Checklist - Ajout reportlab & Export PDF (GestSco v2)



**Date** : 07/09/2026  

**Statut** : ✅ livré



---



## Décision technique (Étape 0)



| Cas d'usage | Outil | Justification |

|-------------|-------|---------------|

| Factures, reçus, relevé compte, bulletins | **reportlab** | Documents tabulaires/programmatiques - code déjà en place |

| Export grille EDT | **reportlab** | Tableau landscape - code déjà en place |

| Templates documents (HTML + CSS) | **weasyprint** (+ **xhtml2pdf** fallback) | Rendu fidèle HTML/CSS ; `reportlab` seul ne parse pas le HTML des templates |



**Coexistence** : les bibliothèques sont complémentaires. Module partagé `app/utils/pdf_generator.py` centralise les helpers (`build_reportlab_pdf`, `html_to_pdf`, styles communs).



**Déploiement** :

- **weasyprint** : nécessite Cairo/Pango sur Linux (prod recommandée).

- **xhtml2pdf** : fallback pure Python pour dev Windows (CSS limité, pas de dépendances GTK).

- Vérifier l'environnement cible avant prod (pas de Docker industrialisé à ce jour).



### Endpoints PDF



| Module | Endpoint | Service |

|--------|----------|---------|

| Finances facture | `GET /api/v1/factures/{id}/pdf` | `generer_facture_pdf` |

| Finances reçu | `GET /api/v1/paiements-factures/{id}/recu` | `generer_recu_pdf` |

| EDT | `GET /api/v1/emplois-temps/{id}/export/pdf` | `generer_emploi_temps_pdf` |

| Templates | `POST /api/v1/templates/{id}/pdf` | `render_document_pdf` → `html_to_pdf` |

| Templates (code) | `POST /api/v1/templates/code/{code}/pdf` | idem |



---



## Étape 0 - Reconnaissance



- [x] Ajouter `reportlab`, `weasyprint`, `xhtml2pdf` à `requirements.txt` / `pyproject.toml`

- [x] Endpoints PDF déjà présents (Finances, EDT) - bloqués par dépendance absente

- [x] Templates : preview HTML OK ; conversion via `html_to_pdf` (weasyprint → xhtml2pdf)

- [x] Décision : reportlab (programmatique) + weasyprint (HTML prod) + xhtml2pdf (fallback dev)



## Étape 1 - Module PDF commun



- [x] `backend/app/utils/pdf_generator.py` - `build_reportlab_pdf`, styles, `html_to_pdf`, `is_pdf_bytes`



## Étape 2 - Finances



- [x] Refactor facture/reçu via `pdf_generator`

- [x] Bouton PDF branché sur pages Bootstrap factures/paiements



## Étape 3 - Emploi du temps



- [x] Export PDF branché dans `EmploiTempsPlanning` (+ retrait bandeau Bootstrap)



## Étape 4 - Templates documents



- [x] Endpoints PDF template + `templateService.exportPDF`

- [x] Retrait bandeaux « hors périmètre v1 »



## Vérification



- [x] `pytest` tests PDF (`test_pdf_generator.py` - 9 tests : unit + facture + reçu + EDT + template)

- [x] `tsc --noEmit`

- [ ] Test manuel visuel (3 cas)



## Documentation



- [x] Retirer mentions « reportlab absent » dans audits/checklists

- [x] `11_PLAN_ACTION.md` §3.2

---

## Corrections visuelles (post-preview 07/09/2026)

### Priorité haute

- [x] EDT : placeholder `-` si salle absente (`format_seance_edt_cell` dans `pdf_formatters.py`)
- [x] EDT : libellé matière prioritaire sur le code (`matiere_libelle` → fallback `matiere_code`)
- [x] Template : suppression `<img src="">` vide (`sanitize_html_for_pdf`) + enrichissement variables depuis `ConfigurationEtablissement`

### Priorité moyenne

- [x] Facture : en-tête établissement (`get_active_etablissement_config`) + pied de page (date édition + n° page)
- [x] Facture : statut humanisé (`format_statut_facture`, aligné frontend)

### Priorité basse

- [x] EDT : dates sous-titre en `dd/mm/yyyy` (`format_date_fr`)
- [x] Template : coquille « de l'{{ nom_etablissement }} » dans `init_templates.py`

### Limitation acceptée (non corrigée)

- **xhtml2pdf** (fallback dev Windows) : CSS partiel (`max-height`, fonds colorés, Times New Roman) - fidélité complète via **weasyprint** en prod Linux uniquement. Documenté dans § Décision technique ci-dessus.

### Vérification post-corrections

- [x] `pytest` tests PDF (12 tests)
- [x] Régénération preview (`generate_pdf_preview_samples.py`) - plus de `None` EDT, statut humanisé, dates `dd/mm/yyyy`, logo vide géré sans erreur xhtml2pdf
- [ ] Relecture visuelle manuelle des 3 PDF

**Note données de test** : sans `ConfigurationEtablissement` en base, le script preview injecte des variables établissement de démo ; en prod le flux `enrich_template_variables` alimente automatiquement depuis la config active. Logo absent = balise `<img>` retirée (pas d'erreur silencieuse).


