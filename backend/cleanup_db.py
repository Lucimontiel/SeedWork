# LIMPIEZA DE TOKENS DE LA BASE DE DATOS
from database import SessionLocal
from models import RefreshToken, PasswordResetToken, EmailVerificationToken, AuditLog
from datetime import datetime, timedelta, timezone

def limpiar_base_de_datos():
    db = SessionLocal()
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    
    try:
        print("Iniciando limpieza de base de datos...")

        # 1. RefreshTokens (Borrar si expiró hace más de 7 días o fue revocado hace 7 días)
        limite_rt = ahora - timedelta(days=7)
        borrados_rt = db.query(RefreshToken).filter(
            ((RefreshToken.ExpiraEn < ahora) | (RefreshToken.Revocado == True)) &
            (RefreshToken.FechaCreacion < limite_rt)
        ).delete(synchronize_session=False)

        # 2. PasswordResetTokens (Borrar usados o expirados hace más de 1 día)
        limite_prt = ahora - timedelta(days=1)
        borrados_prt = db.query(PasswordResetToken).filter(
            ((PasswordResetToken.ExpiraEn < ahora) | (PasswordResetToken.Usado == True)) &
            (PasswordResetToken.FechaCreacion < limite_prt)
        ).delete(synchronize_session=False)

        # 3. EmailVerificationTokens (Borrar usados o expirados hace más de 7 días)
        limite_evt = ahora - timedelta(days=7)
        borrados_evt = db.query(EmailVerificationToken).filter(
            ((EmailVerificationToken.ExpiraEn < ahora) | (EmailVerificationToken.Usado == True)) &
            (EmailVerificationToken.FechaCreacion < limite_evt)
        ).delete(synchronize_session=False)

        # 4. AuditLogs (Borrar registros con más de 90 días de antigüedad)
        limite_audit = ahora - timedelta(days=90)
        borrados_audit = db.query(AuditLog).filter(AuditLog.Fecha < limite_audit).delete(synchronize_session=False)

        db.commit()
        
        print("✅ Limpieza completada con éxito:")
        print(f"   - RefreshTokens eliminados: {borrados_rt}")
        print(f"   - ResetTokens eliminados: {borrados_prt}")
        print(f"   - VerifyTokens eliminados: {borrados_evt}")
        print(f"   - AuditLogs eliminados: {borrados_audit}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error en la limpieza: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    limpiar_base_de_datos()