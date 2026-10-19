"""Test rápido de envío con SendGrid."""
import os
from dotenv import load_dotenv
from pathlib import Path

_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path)

from email_service import enviar_email, email_recuperar_password

# Cambia esto por TU correo real para probar
DESTINATARIO = "tu-correo-real@gmail.com"

html = email_recuperar_password(
    nombre="Viviana",
    enlace="http://localhost:3000/reset-password?token=test123",
    expira_minutos=60,
)

resultado = enviar_email(
    destinatario=DESTINATARIO,
    asunto="[SeedWork] Recupera tu contraseña",
    html=html,
    texto_plano="Recupera tu contraseña: http://localhost:3000/reset-password?token=test123",
)

print("Envío exitoso" if resultado else "Falló el envío")