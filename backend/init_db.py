from database import Base, engine
import models

print("Creando tablas en Aiven...")
Base.metadata.create_all(bind=engine)
print("Tablas creadas correctamente")