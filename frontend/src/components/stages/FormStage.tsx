import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Row, 
  Col, 
  ProgressBar,
  Alert,
  Spinner
} from 'react-bootstrap';
import { ArrowLeft, ArrowRight, Check } from 'react-bootstrap-icons';
import { Stage } from '../../types/anneeAcademique';

interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
}

interface Matiere {
  id: number;
  code: string;
  libelle: string;
}

interface Niveau {
  id: number;
  code: string;
  libelle: string;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
}

interface FormStageProps {
  initialData?: Partial<Stage>;
  etudiants?: Etudiant[];
  matieres?: Matiere[];
  niveaux?: Niveau[];
  enseignants?: Enseignant[];
  onSubmit: (data: Partial<Stage>) => Promise<void>;
  onCancel: () => void;
}

const FormStage: React.FC<FormStageProps> = ({
  initialData,
  etudiants = [],
  matieres = [],
  niveaux = [],
  enseignants = [],
  onSubmit,
  onCancel
}) => {
  const [etapeActuelle, setEtapeActuelle] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Stage>>({
    type_stage: 'pratique',
    duree_semaines: 8,
    statut: 'en_cours',
    ...initialData
  });

  const etapes = [
    { numero: 1, titre: 'Informations générales' },
    { numero: 2, titre: 'Entreprise d\'accueil' },
    { numero: 3, titre: 'Encadrement' },
    { numero: 4, titre: 'Thème et objectifs' }
  ];

  const handleChange = (field: keyof Stage, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (erreurs[field]) {
      setErreurs(prev => {
        const newErreurs = { ...prev };
        delete newErreurs[field];
        return newErreurs;
      });
    }
  };

  const calculerDateFin = (dateDebut: string, duree: number) => {
    if (!dateDebut || !duree) return '';
    const date = new Date(dateDebut);
    date.setDate(date.getDate() + duree * 7);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (formData.date_debut && formData.duree_semaines) {
      const dateFin = calculerDateFin(formData.date_debut, formData.duree_semaines);
      setFormData(prev => ({ ...prev, date_fin: dateFin }));
    }
  }, [formData.date_debut, formData.duree_semaines]);

  const validerEtape = (etape: number): boolean => {
    const newErreurs: Record<string, string> = {};

    switch (etape) {
      case 1:
        if (!formData.etudiant_id) newErreurs.etudiant_id = 'Étudiant requis';
        if (!formData.niveau_id) newErreurs.niveau_id = 'Niveau requis';
        if (!formData.type_stage) newErreurs.type_stage = 'Type de stage requis';
        if (!formData.duree_semaines) newErreurs.duree_semaines = 'Durée requise';
        if (!formData.date_debut) newErreurs.date_debut = 'Date de début requise';
        break;
      case 2:
        if (!formData.entreprise_nom) newErreurs.entreprise_nom = 'Nom de l\'entreprise requis';
        break;
      case 3:
        if (!formData.maitre_stage_nom) newErreurs.maitre_stage_nom = 'Nom du maître de stage requis';
        break;
      case 4:
        if (!formData.theme) newErreurs.theme = 'Thème du stage requis';
        break;
    }

    setErreurs(newErreurs);
    return Object.keys(newErreurs).length === 0;
  };

  const handleSuivant = () => {
    if (validerEtape(etapeActuelle)) {
      setEtapeActuelle(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrecedent = () => {
    setEtapeActuelle(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validerEtape(etapeActuelle)) return;

    setLoading(true);
    setErreur(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const renderEtape1 = () => (
    <>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Étudiant <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.etudiant_id || ''}
              onChange={(e) => handleChange('etudiant_id', parseInt(e.target.value))}
              isInvalid={!!erreurs.etudiant_id}
            >
              <option value="">Sélectionner un étudiant</option>
              {etudiants.map(e => (
                <option key={e.id} value={e.id}>
                  {e.matricule} - {e.prenom} {e.nom}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{erreurs.etudiant_id}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Niveau <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.niveau_id || ''}
              onChange={(e) => handleChange('niveau_id', parseInt(e.target.value))}
              isInvalid={!!erreurs.niveau_id}
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map(n => (
                <option key={n.id} value={n.id}>{n.libelle}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{erreurs.niveau_id}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Type de stage <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.type_stage || ''}
              onChange={(e) => handleChange('type_stage', e.target.value)}
              isInvalid={!!erreurs.type_stage}
            >
              <option value="observation">Stage d'observation</option>
              <option value="pratique">Stage pratique</option>
              <option value="professionnel">Stage professionnel</option>
              <option value="recherche">Stage de recherche</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{erreurs.type_stage}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Durée (semaines) <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={52}
              value={formData.duree_semaines || ''}
              onChange={(e) => handleChange('duree_semaines', parseInt(e.target.value))}
              isInvalid={!!erreurs.duree_semaines}
            />
            <Form.Control.Feedback type="invalid">{erreurs.duree_semaines}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Date de début <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="date"
              value={formData.date_debut || ''}
              onChange={(e) => handleChange('date_debut', e.target.value)}
              isInvalid={!!erreurs.date_debut}
            />
            <Form.Control.Feedback type="invalid">{erreurs.date_debut}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Date de fin (calculée)</Form.Label>
            <Form.Control
              type="date"
              value={formData.date_fin || ''}
              readOnly
              className="bg-light"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Matière associée</Form.Label>
        <Form.Select
          value={formData.matiere_id || ''}
          onChange={(e) => handleChange('matiere_id', parseInt(e.target.value))}
        >
          <option value="">Sélectionner une matière (optionnel)</option>
          {matieres.map(m => (
            <option key={m.id} value={m.id}>{m.code} - {m.libelle}</option>
          ))}
        </Form.Select>
      </Form.Group>
    </>
  );

  const renderEtape2 = () => (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Nom de l'entreprise <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          value={formData.entreprise_nom || ''}
          onChange={(e) => handleChange('entreprise_nom', e.target.value)}
          isInvalid={!!erreurs.entreprise_nom}
          placeholder="Ex: SONABEL"
        />
        <Form.Control.Feedback type="invalid">{erreurs.entreprise_nom}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Adresse</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={formData.entreprise_adresse || ''}
          onChange={(e) => handleChange('entreprise_adresse', e.target.value)}
          placeholder="Adresse complète de l'entreprise"
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Téléphone</Form.Label>
            <Form.Control
              type="tel"
              value={formData.entreprise_telephone || ''}
              onChange={(e) => handleChange('entreprise_telephone', e.target.value)}
              placeholder="Ex: +226 25 XX XX XX"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={formData.entreprise_email || ''}
              onChange={(e) => handleChange('entreprise_email', e.target.value)}
              placeholder="contact@entreprise.bf"
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );

  const renderEtape3 = () => (
    <>
      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Maître de stage (entreprise)</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom complet <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.maitre_stage_nom || ''}
                  onChange={(e) => handleChange('maitre_stage_nom', e.target.value)}
                  isInvalid={!!erreurs.maitre_stage_nom}
                  placeholder="Nom et prénom"
                />
                <Form.Control.Feedback type="invalid">{erreurs.maitre_stage_nom}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fonction</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.maitre_stage_fonction || ''}
                  onChange={(e) => handleChange('maitre_stage_fonction', e.target.value)}
                  placeholder="Ex: Chef de service IT"
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={formData.maitre_stage_email || ''}
              onChange={(e) => handleChange('maitre_stage_email', e.target.value)}
              placeholder="maitre.stage@entreprise.bf"
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Form.Group className="mb-3">
        <Form.Label>Encadrant académique</Form.Label>
        <Form.Select
          value={formData.encadrant_academique_id || ''}
          onChange={(e) => handleChange('encadrant_academique_id', e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="">Sélectionner un enseignant (optionnel)</option>
          {enseignants.map(e => (
            <option key={e.id} value={e.id}>
              {e.prenom} {e.nom}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </>
  );

  const renderEtape4 = () => (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Thème du stage <span className="text-danger">*</span></Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.theme || ''}
          onChange={(e) => handleChange('theme', e.target.value)}
          isInvalid={!!erreurs.theme}
          placeholder="Décrivez le thème principal du stage"
        />
        <Form.Control.Feedback type="invalid">{erreurs.theme}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Objectifs</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={formData.objectifs || ''}
          onChange={(e) => handleChange('objectifs', e.target.value)}
          placeholder="Listez les objectifs du stage"
        />
      </Form.Group>
    </>
  );

  const renderEtapeContent = () => {
    switch (etapeActuelle) {
      case 1: return renderEtape1();
      case 2: return renderEtape2();
      case 3: return renderEtape3();
      case 4: return renderEtape4();
      default: return null;
    }
  };

  const progression = (etapeActuelle / 4) * 100;

  return (
    <Form onSubmit={handleSubmit}>
      {/* Indicateur de progression */}
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-2">
          {etapes.map(etape => (
            <div 
              key={etape.numero}
              className={`text-center flex-fill ${etape.numero === etapeActuelle ? 'fw-bold text-primary' : 'text-muted'}`}
            >
              <div 
                className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-1
                  ${etape.numero < etapeActuelle ? 'bg-success text-white' : 
                    etape.numero === etapeActuelle ? 'bg-primary text-white' : 'bg-light'}`}
                style={{ width: 32, height: 32 }}
              >
                {etape.numero < etapeActuelle ? <Check /> : etape.numero}
              </div>
              <div className="small d-none d-md-block">{etape.titre}</div>
            </div>
          ))}
        </div>
        <ProgressBar now={progression} variant="primary" style={{ height: 4 }} />
      </div>

      {erreur && (
        <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
          {erreur}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Étape {etapeActuelle} : {etapes[etapeActuelle - 1].titre}</h5>
        </Card.Header>
        <Card.Body>
          {renderEtapeContent()}
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between">
        <div>
          {etapeActuelle > 1 && (
            <Button variant="outline-secondary" onClick={handlePrecedent}>
              <ArrowLeft className="me-1" /> Précédent
            </Button>
          )}
        </div>
        <div>
          <Button variant="secondary" onClick={onCancel} className="me-2">
            Annuler
          </Button>
          {etapeActuelle < 4 ? (
            <Button variant="primary" onClick={handleSuivant}>
              Suivant <ArrowRight className="ms-1" />
            </Button>
          ) : (
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="me-1" /> Enregistrer
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
};

export default FormStage;
