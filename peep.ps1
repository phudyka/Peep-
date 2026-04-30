param (
    [Parameter(Position=0, Mandatory=$false)]
    [string]$Action = "help"
)

function Show-Help {
    Write-Host "====== Peep Docker Manager ======" -ForegroundColor Cyan
    Write-Host "Usage: .\peep.ps1 [command]"
    Write-Host ""
    Write-Host "Commandes disponibles :"
    Write-Host "  start   - Lance le projet en arrière-plan (docker compose up -d)" -ForegroundColor Green
    Write-Host "  stop    - Arrête le projet (docker compose stop)" -ForegroundColor Yellow
    Write-Host "  build   - Reconstruit et lance le projet (docker compose up --build -d)" -ForegroundColor Magenta
    Write-Host "  clean   - Supprime les conteneurs et les réseaux (docker compose down)" -ForegroundColor Yellow
    Write-Host "  flush   - ATTENTION : Supprime tout (conteneurs, volumes DB, et images)" -ForegroundColor Red
    Write-Host "  logs    - Affiche les logs du backend et frontend en direct" -ForegroundColor Cyan
    Write-Host "================================="
}

switch ($Action.ToLower()) {
    "start" {
        Write-Host "[DÉMARRAGE] Lancement de Peep..." -ForegroundColor Green
        docker compose up -d
    }
    "stop" {
        Write-Host "[ARRÊT] Arrêt des conteneurs..." -ForegroundColor Yellow
        docker compose stop
    }
    "build" {
        Write-Host "[BUILD] Reconstruction des conteneurs..." -ForegroundColor Magenta
        docker compose up --build -d
    }
    "clean" {
        Write-Host "[NETTOYAGE] Suppression des conteneurs..." -ForegroundColor Yellow
        docker compose down
    }
    "flush" {
        Write-Host "[FLUSH] Attention, suppression de la base de données et des images dans 5 secondes (Ctrl+C pour annuler)..." -ForegroundColor Red
        Start-Sleep -Seconds 5
        docker compose down -v --rmi all
        Write-Host "[FLUSH] Nettoyage complet terminé." -ForegroundColor Green
    }
    "logs" {
        Write-Host "[LOGS] Affichage des logs (Ctrl+C pour quitter)..." -ForegroundColor Cyan
        docker compose logs -f
    }
    default {
        Show-Help
    }
}
