/**
 * E2E portail enseignant - parcours réel navigateur.
 *
 * Prérequis (backend/) :
 *   python scripts/e2e_manual_test_resultats.py   # données E2E-MANUAL
 *   python scripts/e2e_portail_enseignant_verify.py setup
 *
 * Compte : e2e-teacher@example.com / E2E-Portail-2026!
 */

const E2E_EMAIL = 'e2e-teacher@example.com';
const E2E_PASSWORD = 'E2E-Portail-2026!';
const E2E_STAGE_CODE = 'E2E-PORTAIL-ENS-STAGE-01';
const E2E_STAGE_THEME = 'Portail enseignant - stage encadré E2E';
const E2E_TEACHER_NOTE = 14.5;
const E2E_STUDENT_MATRICULE = 'E2E-MANUAL-001';

describe('Portail enseignant E2E', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type(E2E_EMAIL);
    cy.get('input[type="password"]').clear().type(E2E_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/enseignant/dashboard');
  });

  it('dashboard affiche les stats et le nom enseignant', () => {
    cy.contains('Tableau de bord Enseignant').should('be.visible');
    cy.contains('Prof E2E Portail').should('be.visible');
    cy.contains('Séances cette semaine').should('be.visible');
    cy.contains('Stages encadrés').should('be.visible');
  });

  it('dashboard liste le stage encadré E2E', () => {
    cy.contains(E2E_STAGE_CODE, { timeout: 10000 }).should('be.visible');
    cy.contains(E2E_STAGE_THEME).should('be.visible');
    cy.contains('Entreprise E2E Portail').should('be.visible');
  });

  it('mon emploi du temps se charge sans erreur', () => {
    cy.visit('/enseignant/emploi-temps');
    cy.contains(/emploi du temps/i, { timeout: 10000 }).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('mes stages encadrés affiche le stage E2E', () => {
    cy.visit('/enseignant/stages');
    cy.contains('Mes stages encadrés', { timeout: 10000 }).should('be.visible');
    cy.contains(E2E_STAGE_CODE).should('be.visible');
    cy.contains(E2E_STAGE_THEME).should('be.visible');
    cy.contains('en_cours').should('be.visible');
  });

  it('refuse l accès aux stages encadrés par un autre enseignant (403)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string');
      cy.request({
        method: 'GET',
        url: '/api/v1/stages/encadrant/99999',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
    });
  });

  it('refuse l accès aux séances d un autre enseignant (403)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string');
      cy.request({
        method: 'GET',
        url: '/api/v1/seances/enseignant/99999',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
    });
  });

  it('saisie notes - page enseignant se charge', () => {
    cy.visit('/enseignant/notes/saisie');
    cy.contains('Saisie des notes', { timeout: 10000 }).should('be.visible');
    cy.contains('Enregistrement des notes pour vos matières enseignées').should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('saisie notes - API enseignant saisit une note CC', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/seances/mes-matieres-enseignement', headers }).then(
        (scopeResp) => {
          expect(scopeResp.status).to.eq(200);
          expect(scopeResp.body.length).to.be.greaterThan(0);
          const row = scopeResp.body[0];

          cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then((sessResp) => {
            const session = (sessResp.body as Array<{ id: number; statut: string }>).find(
              (s) => s.statut === 'en_cours',
            );
            expect(session, 'session en_cours').to.exist;

            const examenPayload = {
              session_id: session!.id,
              matiere_id: row.matiere_id,
              niveau_id: row.niveau_id,
              type_evaluation: 'controle_continu',
            };

            cy.request({
              method: 'POST',
              url: '/api/v1/examens/saisie-enseignant',
              headers,
              body: examenPayload,
            }).then((exResp) => {
              expect(exResp.status).to.be.oneOf([200, 201]);
              const examenId = exResp.body.id;

              cy.request({
                method: 'GET',
                url: '/api/v1/etudiants/',
                headers,
                qs: { matricule: E2E_STUDENT_MATRICULE, limit: 5 },
              }).then((etuResp) => {
                expect(etuResp.status).to.eq(200);
                const etu = (etuResp.body as Array<{ id: number; matricule: string }>).find(
                  (e) => e.matricule === E2E_STUDENT_MATRICULE,
                );
                expect(etu, `étudiant ${E2E_STUDENT_MATRICULE}`).to.exist;

                cy.request({
                  method: 'GET',
                  url: '/api/v1/inscriptions/',
                  headers,
                  qs: { etudiant_id: etu!.id, limit: 10 },
                }).then((inscResp) => {
                  const insc = (inscResp.body as Array<{ id: number; etudiant_id: number }>)[0];
                  expect(insc, 'inscription').to.exist;

                  cy.request({
                    method: 'GET',
                    url: `/api/v1/inscriptions-matieres/inscription/${insc.id}`,
                    headers,
                    qs: { semestre: 1 },
                  }).then((imResp) => {
                    const im = (imResp.body as Array<{ id: number; matiere_id: number }>).find(
                      (m) => m.matiere_id === row.matiere_id,
                    );
                    expect(im, 'inscription matière').to.exist;

                    cy.request({
                      method: 'GET',
                      url: `/api/v1/notes/examen/${examenId}`,
                      headers,
                    }).then((existingNotesResp) => {
                      const existing = (
                        existingNotesResp.body as Array<{ id: number; etudiant_id: number; note: number }>
                      ).find((n) => n.etudiant_id === insc.etudiant_id);

                      const assertNoteSaved = () => {
                        cy.request({
                          method: 'GET',
                          url: `/api/v1/notes/examen/${examenId}`,
                          headers,
                        }).then((notesResp) => {
                          expect(notesResp.status).to.eq(200);
                          const saved = (notesResp.body as Array<{ note: number }>).some(
                            (n) => n.note === E2E_TEACHER_NOTE,
                          );
                          expect(saved).to.eq(true);
                        });
                      };

                      if (existing?.id) {
                        cy.request({
                          method: 'PUT',
                          url: `/api/v1/notes/${existing.id}`,
                          headers,
                          body: { note: E2E_TEACHER_NOTE },
                        }).then((updateResp) => {
                          expect(updateResp.status).to.eq(200);
                          assertNoteSaved();
                        });
                      } else {
                        cy.request({
                          method: 'POST',
                          url: '/api/v1/notes/bulk',
                          headers,
                          body: {
                            examen_id: examenId,
                            notes: [
                              {
                                etudiant_id: insc.etudiant_id,
                                inscription_matiere_id: im!.id,
                                note: E2E_TEACHER_NOTE,
                                statut_presence: 'present',
                              },
                            ],
                          },
                        }).then((bulkResp) => {
                          expect(bulkResp.status).to.eq(200);
                          assertNoteSaved();
                        });
                      }
                    });
                  });
                });
              });
            });
          });
        },
      );
    });
  });

  it('saisie notes - refuse matière hors périmètre (403)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/seances/mes-matieres-enseignement', headers }).then(
        (scopeResp) => {
          const ownIds = new Set(
            (scopeResp.body as Array<{ matiere_id: number }>).map((r) => r.matiere_id),
          );

          cy.request({ method: 'GET', url: '/api/v1/matieres/', headers, qs: { limit: 100 } }).then((matResp) => {
            const foreign = (matResp.body as Array<{ id: number }>).find(
              (m) => !ownIds.has(m.id),
            );
            expect(foreign, 'matière hors périmètre').to.exist;

            cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then(
              (sessResp) => {
                const session = (sessResp.body as Array<{ id: number; statut: string }>).find(
                  (s) => s.statut === 'en_cours',
                );
                expect(session).to.exist;

                cy.request({
                  method: 'POST',
                  url: '/api/v1/examens/saisie-enseignant',
                  headers,
                  body: {
                    session_id: session!.id,
                    matiere_id: foreign!.id,
                    niveau_id: scopeResp.body[0].niveau_id,
                    type_evaluation: 'controle_continu',
                  },
                  failOnStatusCode: false,
                }).then((resp) => {
                  expect(resp.status).to.eq(403);
                });
              },
            );
          });
        },
      );
    });
  });

  it('feuille d appel - page enseignant se charge', () => {
    cy.visit('/enseignant/presences/appel');
    cy.contains("Feuille d'appel", { timeout: 10000 }).should('be.visible');
    cy.contains('Sélectionner une séance').should('be.visible');
  });

  it('feuille d appel - émarge sa propre séance (API)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/seances/mes-seances', headers }).then((resp) => {
        expect(resp.status).to.eq(200);
        const seance = (resp.body as Array<{ id: number; statut: string }>).find(
          (s) => s.statut === 'confirmee' || s.statut === 'terminee' || s.statut === 'en_cours',
        );
        expect(seance, 'séance enseignant').to.exist;

        cy.request({
          method: 'GET',
          url: `/api/v1/presences/seance/${seance!.id}`,
          headers,
        }).then((feuilleResp) => {
          expect(feuilleResp.status).to.eq(200);
          expect(feuilleResp.body).to.be.an('array');
        });
      });
    });
  });

  it('feuille d appel - refuse séance d un autre enseignant (403)', () => {
    cy.request({
      method: 'POST',
      url: '/api/v1/auth/login',
      body: { username: 'e2e-teacher-b@example.com', password: 'E2E-Portail-2026!' },
      form: true,
    }).then((bLogin) => {
      expect(bLogin.status).to.eq(200);
      const bToken = bLogin.body.access_token;
      cy.request({
        method: 'GET',
        url: '/api/v1/seances/mes-seances',
        headers: { Authorization: `Bearer ${bToken}` },
      }).then((bSeances) => {
        expect(bSeances.body.length).to.be.greaterThan(0);
        const foreignSeanceId = bSeances.body[0].id;

        cy.window().then((win) => {
          const tokenA = win.localStorage.getItem('token');
          cy.request({
            method: 'GET',
            url: `/api/v1/presences/seance/${foreignSeanceId}`,
            headers: { Authorization: `Bearer ${tokenA}` },
            failOnStatusCode: false,
          }).then((resp) => {
            expect(resp.status).to.eq(403);
          });
        });
      });
    });
  });

  it('résultats matières - page enseignant se charge', () => {
    cy.visit('/enseignant/resultats');
    cy.contains('Résultats de mes matières', { timeout: 10000 }).should('be.visible');
    cy.contains('Consultation en lecture seule').should('be.visible');
  });

  it('résultats matières - lecture matière enseignée (API)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/seances/mes-matieres-enseignement', headers }).then(
        (scopeResp) => {
          expect(scopeResp.status).to.eq(200);
          expect(scopeResp.body.length).to.be.greaterThan(0);
          const row = scopeResp.body[0];

          cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then((sessResp) => {
            const session = (sessResp.body as Array<{ id: number }>)[0];
            expect(session).to.exist;

            cy.request({
              method: 'GET',
              url: '/api/v1/resultats/mes-matieres-enseignement',
              headers,
              qs: {
                session_id: session.id,
                matiere_id: row.matiere_id,
                niveau_id: row.niveau_id,
              },
            }).then((resResp) => {
              expect(resResp.status).to.eq(200);
              expect(resResp.body).to.have.property('resultats');
              expect(resResp.body.resultats).to.be.an('array');
            });
          });
        },
      );
    });
  });

  it('résultats matières - refuse matière hors périmètre (403)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/seances/mes-matieres-enseignement', headers }).then(
        (scopeResp) => {
          const ownIds = new Set(
            (scopeResp.body as Array<{ matiere_id: number }>).map((r) => r.matiere_id),
          );

          cy.request({ method: 'GET', url: '/api/v1/matieres/', headers, qs: { limit: 100 } }).then(
            (matResp) => {
              const foreign = (matResp.body as Array<{ id: number }>).find(
                (m) => !ownIds.has(m.id),
              );
              expect(foreign).to.exist;

              cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then(
                (sessResp) => {
                  const session = (sessResp.body as Array<{ id: number }>)[0];

                  cy.request({
                    method: 'GET',
                    url: '/api/v1/resultats/mes-matieres-enseignement',
                    headers,
                    qs: {
                      session_id: session.id,
                      matiere_id: foreign!.id,
                      niveau_id: scopeResp.body[0].niveau_id,
                    },
                    failOnStatusCode: false,
                  }).then((resp) => {
                    expect(resp.status).to.eq(403);
                  });
                },
              );
            },
          );
        },
      );
    });
  });

  it('mes cours - page se charge', () => {
    cy.visit('/enseignant/cours');
    cy.contains('Mes cours', { timeout: 10000 }).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('mes étudiants - page se charge', () => {
    cy.visit('/enseignant/etudiants');
    cy.contains('Mes étudiants', { timeout: 10000 }).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('mes étudiants - API liste les étudiants enseignés', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      cy.request({ method: 'GET', url: '/api/v1/seances/mes-etudiants', headers }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });

  it('documents - page se charge', () => {
    cy.visit('/enseignant/documents');
    cy.contains('Documents', { timeout: 10000 }).should('be.visible');
    cy.contains('Stages encadrés').should('be.visible');
  });
});
