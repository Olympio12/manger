# Gestion des repas familiaux

Application web locale en HTML, CSS et JavaScript.

## Démarrage
Ouvrir `index.html` dans un navigateur récent. Aucune installation ni connexion internet n'est nécessaire.

## Données
Les données sont enregistrées dans le stockage local du navigateur. Utiliser l'onglet Paramètres pour exporter/importer une sauvegarde JSON.

## Important
Le catalogue initial comprend les 15 plats et 10 accompagnements définis. Les compatibilités ne sont volontairement pas préremplies : la matrice exacte des associations validées n'était pas disponible au moment de la génération. Il faut donc les renseigner dans l'onglet Compatibilités avant de générer les repas.

## Limites de cette première version
- Application mono-appareil et mono-navigateur (pas de synchronisation entre appareils).
- La génération du planning privilégie la variété et évite les répétitions, mais signale quand le catalogue ne permet pas de remplir les 28 créneaux sans répétition.
- Les repas précédents non enregistrés peuvent être saisis manuellement dans Repas du jour.
