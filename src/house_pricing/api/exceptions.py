class ModelNotLoadedError(Exception):
    """Levée quand le modèle n'est pas chargé."""

    pass


class PredictionError(Exception):
    """Levée quand une erreur survient pendant la prédiction."""

    pass
