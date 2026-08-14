"""
Module de gestion des permissions et autorisations
"""

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_active_user
from app.models.user import User


async def get_current_scolarite_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Vérifie que l'utilisateur a les droits de scolarité ou admin.
    
    Args:
        current_user: Utilisateur courant authentifié
        
    Returns:
        L'utilisateur si autorisé
        
    Raises:
        HTTPException 403 si non autorisé
    """
    # Vérifier si l'utilisateur est superuser ou a un rôle approprié
    if current_user.is_superuser:
        return current_user
    
    # Vérifier le rôle si le champ existe
    if hasattr(current_user, "role"):
        if current_user.role in ["admin", "scolarite", "administrateur"]:
            return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants. Accès réservé aux administrateurs et à la scolarité.",
    )


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Vérifie que l'utilisateur est administrateur.
    
    Args:
        current_user: Utilisateur courant authentifié
        
    Returns:
        L'utilisateur si administrateur
        
    Raises:
        HTTPException 403 si non autorisé
    """
    if current_user.is_superuser:
        return current_user
    
    if hasattr(current_user, "role") and current_user.role == "admin":
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants. Accès réservé aux administrateurs.",
    )


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Vérifie que l'utilisateur est superuser.
    
    Args:
        current_user: Utilisateur courant authentifié
        
    Returns:
        L'utilisateur si superuser
        
    Raises:
        HTTPException 403 si non autorisé
    """
    if current_user.is_superuser:
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants. Accès réservé aux super-administrateurs.",
    )
