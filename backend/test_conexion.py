from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    resultado = conn.execute(text("SELECT Nombre FROM Municipio WHERE Nombre LIKE '%tag%'"))
    for fila in resultado:
        print(repr(fila[0]))

    print("---")

    resultado2 = conn.execute(
        text("SELECT Nombre FROM Municipio WHERE LOWER(Nombre) = LOWER(:ciudad)"),
        {"ciudad": "Itagüí"},
    )
    filas = resultado2.fetchall()
    print("Filas encontradas con el filtro:", len(filas))
    for fila in filas:
        print(repr(fila[0]))