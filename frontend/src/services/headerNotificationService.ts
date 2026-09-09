import { format, isToday, parseISO } from 'date-fns';
import { getDocuments } from './documentEtudiantService';
import { factureService } from './factureService';
import portalService from './portalService';
import type { HeaderNotification } from '../types/notification';
import type { RbacAction, RbacModule } from '../utils/rbacActions';

export type NotificationPortal = 'admin' | 'teacher' | 'student';

type CanPerformFn = (module: RbacModule, action: RbacAction) => boolean;

const plural = (count: number, singular: string, pluralForm: string): string =>
  count > 1 ? pluralForm : singular;

async function fetchAdminNotifications(canPerform: CanPerformFn): Promise<HeaderNotification[]> {
  const items: HeaderNotification[] = [];
  const tasks: Promise<void>[] = [];

  if (canPerform('etudiants', 'read')) {
    tasks.push(
      getDocuments({ statut: 'en_attente', limit: 100 })
        .then((documents) => {
          if (documents.length === 0) {
            return;
          }
          items.push({
            id: 'admin-docs-en-attente',
            title: 'Documents à valider',
            message: `${documents.length} ${plural(
              documents.length,
              'document en attente',
              'documents en attente'
            )} de validation`,
            href: '/admin/documents/liste',
            variant: 'warning',
            unread: true,
          });
        })
        .catch(() => undefined)
    );
  }

  if (canPerform('finances', 'read')) {
    tasks.push(
      factureService
        .getFacturesImpayees()
        .then((factures) => {
          if (factures.length === 0) {
            return;
          }
          items.push({
            id: 'admin-factures-impayees',
            title: 'Factures impayées',
            message: `${factures.length} ${plural(
              factures.length,
              'facture impayée',
              'factures impayées'
            )} à suivre`,
            href: '/admin/finances/factures',
            variant: 'danger',
            unread: true,
          });
        })
        .catch(() => undefined)
    );
  }

  await Promise.all(tasks);
  return items;
}

async function fetchTeacherNotifications(): Promise<HeaderNotification[]> {
  const items: HeaderNotification[] = [];
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    const seances = await portalService.getMesSeances({
      date_debut: today,
      date_fin: today,
    });
    if (seances.length > 0) {
      items.push({
        id: 'teacher-seances-jour',
        title: 'Cours du jour',
        message: `${seances.length} ${plural(seances.length, 'séance prévue', 'séances prévues')} aujourd'hui`,
        href: '/enseignant/emploi-temps',
        variant: 'info',
        unread: true,
      });
    }
  } catch {
    // Portail enseignant indisponible ou profil non lié
  }

  try {
    const stages = await portalService.getMesStagesEncadres();
    const enCours = stages.filter((stage) => stage.statut === 'en_cours');
    if (enCours.length > 0) {
      items.push({
        id: 'teacher-stages-en-cours',
        title: 'Stages encadrés',
        message: `${enCours.length} ${plural(enCours.length, 'stage en cours', 'stages en cours')} de suivi`,
        href: '/enseignant/stages',
        variant: 'warning',
        unread: true,
      });
    }
  } catch {
    // Ignorer si l'API stages n'est pas accessible
  }

  return items;
}

async function fetchStudentNotifications(): Promise<HeaderNotification[]> {
  const items: HeaderNotification[] = [];

  try {
    const documents = await portalService.getMesDocuments();
    const pending = documents.filter((doc) => doc.statut === 'en_attente');
    const refused = documents.filter((doc) => doc.statut === 'refuse');

    refused.slice(0, 3).forEach((doc) => {
      items.push({
        id: `student-doc-refuse-${doc.id}`,
        title: 'Document refusé',
        message: doc.libelle || doc.type_document || 'Document administratif',
        href: '/etudiant/documents/dossier',
        variant: 'danger',
        unread: true,
      });
    });

    if (pending.length > 0) {
      items.push({
        id: 'student-docs-en-attente',
        title: 'Documents en cours',
        message: `${pending.length} ${plural(
          pending.length,
          'document en attente',
          'documents en attente'
        )} de validation`,
        href: '/etudiant/documents/dossier',
        variant: 'warning',
        unread: true,
      });
    }
  } catch {
    // Ignorer si le profil étudiant n'est pas disponible
  }

  try {
    const factures = await portalService.getMesFactures();
    const impayees = factures.filter(
      (facture) => facture.montant_restant > 0 && facture.statut !== 'annulee'
    );
    if (impayees.length > 0) {
      items.push({
        id: 'student-factures-impayees',
        title: 'Paiements en attente',
        message: `${impayees.length} ${plural(
          impayees.length,
          'facture à régler',
          'factures à régler'
        )}`,
        href: '/etudiant/finances/factures',
        variant: 'danger',
        unread: true,
      });
    }
  } catch {
    // Ignorer si les finances étudiant ne sont pas accessibles
  }

  try {
    const seances = await portalService.getMesSeances({
      date_debut: format(new Date(), 'yyyy-MM-dd'),
      date_fin: format(new Date(), 'yyyy-MM-dd'),
    });
    const todaySeances = seances.filter((seance) => isToday(parseISO(seance.date_seance)));
    if (todaySeances.length > 0) {
      items.push({
        id: 'student-seances-jour',
        title: 'Emploi du temps',
        message: `${todaySeances.length} cours prévu(s) aujourd'hui`,
        href: '/etudiant/emploi-temps',
        variant: 'info',
        unread: true,
      });
    }
  } catch {
    // Ignorer si l'EDT étudiant n'est pas accessible
  }

  return items.slice(0, 8);
}

export async function fetchHeaderNotifications(
  portal: NotificationPortal,
  canPerform: CanPerformFn = () => false
): Promise<HeaderNotification[]> {
  switch (portal) {
    case 'admin':
      return fetchAdminNotifications(canPerform);
    case 'teacher':
      return fetchTeacherNotifications();
    case 'student':
      return fetchStudentNotifications();
    default:
      return [];
  }
}

export function getNotificationsViewAllHref(
  portal: NotificationPortal,
  items: HeaderNotification[]
): string | null {
  if (items.length === 0) {
    return null;
  }

  switch (portal) {
    case 'admin':
      return items[0]?.href ?? '/admin/dashboard';
    case 'teacher':
      return '/enseignant/dashboard';
    case 'student':
      return '/etudiant/dashboard';
    default:
      return null;
  }
}
