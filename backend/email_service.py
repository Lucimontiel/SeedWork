import os
import resend

# Configuración de Resend
resend.api_key = os.getenv("RESEND_API_KEY")

def enviar_correo_recuperacion(destinatario: str, enlace: str):
    try:
        resend.Emails.send({
            "from": os.getenv("FROM_EMAIL", "SeedWork <onboarding@resend.dev>"),
            "to": [destinatario],
            "subject": "Recupera tu contraseña de SeedWork",
            "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0d47c9;">Recuperación de contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña en SeedWork.</p>
                    <p>Haz clic en el siguiente enlace para crear una nueva contraseña. El enlace expirará en 15 minutos.</p>
                    <a href="{enlace}" style="display: inline-block; padding: 12px 24px; background-color: #0d47c9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
                        Restablecer contraseña
                    </a>
                    <p style="color: #64748b; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                </div>
            """
        })
        print(f"✅ Correo de recuperación enviado a {destinatario}")
    except Exception as e:
        print(f"❌ Error al enviar correo de recuperación: {e}")


def enviar_correo_verificacion(destinatario: str, enlace: str):
    try:
        resend.Emails.send({
            "from": os.getenv("FROM_EMAIL", "SeedWork <onboarding@resend.dev>"),
            "to": [destinatario],
            "subject": "Verifica tu cuenta de SeedWork",
            "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0d47c9;">¡Bienvenido/a a SeedWork!</h2>
                    <p>Estás a un solo paso de empezar a descubrir nuevas oportunidades.</p>
                    <p>Por favor, haz clic en el siguiente botón para verificar tu correo electrónico:</p>
                    <a href="{enlace}" style="display: inline-block; padding: 12px 24px; background-color: #0d47c9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
                        Verificar mi correo
                    </a>
                    <p style="color: #64748b; font-size: 12px;">Este enlace expirará en 24 horas.</p>
                </div>
            """
        })
        print(f"✅ Correo de verificación enviado a {destinatario}")
    except Exception as e:
        print(f"❌ Error al enviar correo de verificación: {e}")
