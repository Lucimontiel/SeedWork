SET NAMES utf8mb4;

-- Muchas instalaciones de phpMyAdmin traen activado el "modo seguro" (SQL_SAFE_UPDATES),
-- que bloquea cualquier UPDATE/DELETE cuyo WHERE no use una columna con índice/llave.
-- Lo desactivamos para poder correr este script de una sola pasada.
SET SQL_SAFE_UPDATES = 0;

-- Desactivamos temporalmente la verificación de llaves foráneas mientras se
-- recrean las tablas y se cargan los datos de prueba, para que el orden de
-- ejecución nunca sea un problema. Se reactiva al final del script.
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Limpia y crea la base de datos
DROP DATABASE IF EXISTS seedwork;
CREATE DATABASE seedwork CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE seedwork;

-- ============================================================
-- CATALOGOS BASE (Coinciden exactamente con models.py)
-- ============================================================

CREATE TABLE Rol (
    IdRol INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(30) UNIQUE NOT NULL
);
INSERT INTO Rol (Nombre) VALUES ('Administrador'), ('Empresa'), ('Candidato');

CREATE TABLE EstadoUsuario (
    IdEstadoUsuario INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(30) UNIQUE NOT NULL
);
INSERT INTO EstadoUsuario (Nombre) VALUES ('Activo'), ('Pendiente'), ('Suspendido'), ('Bloqueado');

CREATE TABLE Pais (
    IdPais INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Departamento (
    IdDepartamento INT AUTO_INCREMENT PRIMARY KEY,
    IdPais INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Departamento_Pais FOREIGN KEY (IdPais) REFERENCES Pais(IdPais)
);

CREATE TABLE Municipio (
    IdMunicipio INT AUTO_INCREMENT PRIMARY KEY,
    IdDepartamento INT NOT NULL,
    Nombre VARCHAR(120) NOT NULL,
    CONSTRAINT FK_Municipio_Departamento FOREIGN KEY (IdDepartamento) REFERENCES Departamento(IdDepartamento)
);

CREATE TABLE SectorEmpresa (
    IdSectorEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO SectorEmpresa (Nombre) VALUES ('Tecnología'), ('Educación'), ('Salud'), ('Finanzas'), ('Construcción'), ('Otro');

CREATE TABLE TamanoEmpresa (
    IdTamanoEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    Rango VARCHAR(40) UNIQUE NOT NULL
);
INSERT INTO TamanoEmpresa (Rango) VALUES ('1 - 10 Empleados'), ('11 - 50 Empleados'), ('51 - 200 Empleados'), ('201 - 500 Empleados'), ('Más de 500 Empleados');

CREATE TABLE Modalidad (
    IdModalidad INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO Modalidad (Nombre) VALUES ('Presencial'), ('Remoto'), ('Híbrido');

CREATE TABLE Disponibilidad (
    IdDisponibilidad INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO Disponibilidad (Nombre) VALUES ('Inmediata'), ('1 mes'), ('3 meses');

CREATE TABLE CategoriaOferta (
    IdCategoria INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) UNIQUE NOT NULL
);
INSERT INTO CategoriaOferta (Nombre) VALUES ('Desarrollo de Software'), ('Diseño Gráfico'), ('Marketing'), ('Administración'), ('Recursos Humanos'), ('Contabilidad'), ('Ventas'), ('Atención al Cliente'), ('Logística'), ('Salud');

CREATE TABLE TipoContrato (
    IdTipoContrato INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO TipoContrato (Nombre) VALUES ('Término Fijo'), ('Término Indefinido'), ('Prestación de Servicios'), ('Aprendizaje'), ('Temporal');

CREATE TABLE JornadaLaboral (
    IdJornada INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO JornadaLaboral (Nombre) VALUES ('Tiempo Completo'), ('Medio Tiempo'), ('Por Horas'), ('Flexible');

CREATE TABLE EstadoOferta (
    IdEstadoOferta INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO EstadoOferta (Nombre) VALUES ('Publicada'), ('Pausada'), ('Rechazada'), ('Cerrada'), ('Por aprobar');

CREATE TABLE EstadoPostulacion (
    IdEstadoPostulacion INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO EstadoPostulacion (Nombre) VALUES ('Postulado'), ('En revisión'), ('Preseleccionado'), ('Entrevista'), ('Prueba Técnica'), ('Contratado'), ('Rechazado');

CREATE TABLE TipoNotificacion (
    IdTipoNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE
);
INSERT INTO TipoNotificacion (Nombre) VALUES
    ('Nueva Oferta'), ('Nueva Postulación'), ('Entrevista'), ('IA'), ('Sistema'), ('Reporte');

-- ============================================================
-- USUARIOS (Coincide con models.py)
-- ============================================================

CREATE TABLE Usuario (
    IdUsuario INT AUTO_INCREMENT PRIMARY KEY,
    IdRol INT NOT NULL,
    IdEstadoUsuario INT NOT NULL,
    Correo VARCHAR(150) NOT NULL UNIQUE,
    Contrasena VARCHAR(255) NOT NULL,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Usuario_Rol FOREIGN KEY (IdRol) REFERENCES Rol(IdRol),
    CONSTRAINT FK_Usuario_Estado FOREIGN KEY (IdEstadoUsuario) REFERENCES EstadoUsuario(IdEstadoUsuario)
);

CREATE TABLE Administrador (
    IdAdministrador INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL UNIQUE,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Documento VARCHAR(20),
    Telefono VARCHAR(20),
    CONSTRAINT FK_Admin_Usuario FOREIGN KEY (IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE
);

-- Empresa: se incluyen desde ya las columnas que antes se agregaban con
-- ALTER TABLE (SitioWeb, CorreoCorporativo, Especialidades, AnioFundacion,
-- Mision, Vision, LogoUrl), porque son las que usa main.py hoy.
CREATE TABLE Empresa (
    IdEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL UNIQUE,
    IdMunicipio INT NOT NULL,
    IdSectorEmpresa INT,
    IdTamanoEmpresa INT,
    NombreEmpresa VARCHAR(150) NOT NULL,
    NIT VARCHAR(20) NOT NULL UNIQUE,
    Descripcion TEXT,
    SitioWeb VARCHAR(255),
    CorreoCorporativo VARCHAR(150),
    Especialidades VARCHAR(255),
    AnioFundacion INT,
    Mision TEXT,
    Vision TEXT,
    LogoUrl TEXT,
    Direccion VARCHAR(150),
    Telefono VARCHAR(20),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Empresa_Usuario FOREIGN KEY (IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_Empresa_Municipio FOREIGN KEY (IdMunicipio) REFERENCES Municipio(IdMunicipio),
    CONSTRAINT FK_Empresa_Sector FOREIGN KEY (IdSectorEmpresa) REFERENCES SectorEmpresa(IdSectorEmpresa),
    CONSTRAINT FK_Empresa_Tamano FOREIGN KEY (IdTamanoEmpresa) REFERENCES TamanoEmpresa(IdTamanoEmpresa)
);

-- Candidato: igual, se incluyen desde ya las columnas de preferencias que
-- antes se agregaban con ALTER TABLE (IdTipoContratoPreferido, IdJornadaPreferida,
-- AreaInteres, SalarioEsperado, Movilidad, FechaNacimiento), que ahora también
-- están declaradas en models.py.
CREATE TABLE Candidato (
    IdCandidato INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL UNIQUE,
    IdMunicipio INT,
    IdModalidad INT,
    IdDisponibilidad INT,
    IdTipoContratoPreferido INT,
    IdJornadaPreferida INT,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20),
    AcercaDe TEXT,
    TituloProfesional VARCHAR(150),
    FotoUrl TEXT,
    PlantillaCV VARCHAR(20) DEFAULT 'clasico',
    FechaNacimiento DATE,
    AreaInteres VARCHAR(255),
    SalarioEsperado DECIMAL(12,2),
    Movilidad VARCHAR(100),
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Candidato_Usuario FOREIGN KEY (IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_Candidato_Municipio FOREIGN KEY (IdMunicipio) REFERENCES Municipio(IdMunicipio),
    CONSTRAINT FK_Candidato_Modalidad FOREIGN KEY (IdModalidad) REFERENCES Modalidad(IdModalidad),
    CONSTRAINT FK_Candidato_Disponibilidad FOREIGN KEY (IdDisponibilidad) REFERENCES Disponibilidad(IdDisponibilidad),
    CONSTRAINT FK_Candidato_TipoContrato FOREIGN KEY (IdTipoContratoPreferido) REFERENCES TipoContrato(IdTipoContrato),
    CONSTRAINT FK_Candidato_Jornada FOREIGN KEY (IdJornadaPreferida) REFERENCES JornadaLaboral(IdJornada)
);

-- ============================================================
-- SECCIONES DEL CV (Coincide con models.py)
-- ============================================================

CREATE TABLE CandidatoHabilidad (
    IdHabilidad INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Nombre VARCHAR(80) NOT NULL,
    CONSTRAINT FK_CH_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE CandidatoEducacion (
    IdEducacion INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Titulo VARCHAR(150) NOT NULL,
    Institucion VARCHAR(150),
    Anio VARCHAR(20),
    CONSTRAINT FK_CE_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE CandidatoProyecto (
    IdProyecto INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Titulo VARCHAR(150) NOT NULL,
    Descripcion TEXT,
    Meta VARCHAR(120),
    CONSTRAINT FK_CP_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE CandidatoIdioma (
    IdIdioma INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Descripcion VARCHAR(120) NOT NULL,
    CONSTRAINT FK_CI_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE CandidatoReferencia (
    IdReferencia INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Nombre VARCHAR(120) NOT NULL,
    Cargo VARCHAR(150),
    Contacto VARCHAR(120),
    CONSTRAINT FK_CR_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE CandidatoSeccionCV (
    IdSeccion INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Titulo VARCHAR(120) NOT NULL,
    Contenido TEXT,
    Orden INT DEFAULT 0,
    CONSTRAINT FK_CS_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

-- ============================================================
-- OFERTAS Y POSTULACIONES (Coincide con models.py)
-- ============================================================

CREATE TABLE Oferta (
    IdOferta INT AUTO_INCREMENT PRIMARY KEY,
    IdEmpresa INT NOT NULL,
    IdCategoria INT NOT NULL,
    IdTipoContrato INT NOT NULL,
    IdModalidad INT NOT NULL,
    IdJornada INT NOT NULL,
    IdEstadoOferta INT NOT NULL,
    IdMunicipio INT NOT NULL,
    Titulo VARCHAR(200) NOT NULL,
    Descripcion TEXT NOT NULL,
    Vacantes INT DEFAULT 1,
    ExperienciaMinima INT DEFAULT 0,
    FechaPublicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Oferta_Empresa FOREIGN KEY (IdEmpresa) REFERENCES Empresa(IdEmpresa),
    CONSTRAINT FK_Oferta_Categoria FOREIGN KEY (IdCategoria) REFERENCES CategoriaOferta(IdCategoria),
    CONSTRAINT FK_Oferta_Contrato FOREIGN KEY (IdTipoContrato) REFERENCES TipoContrato(IdTipoContrato),
    CONSTRAINT FK_Oferta_Modalidad FOREIGN KEY (IdModalidad) REFERENCES Modalidad(IdModalidad),
    CONSTRAINT FK_Oferta_Jornada FOREIGN KEY (IdJornada) REFERENCES JornadaLaboral(IdJornada),
    CONSTRAINT FK_Oferta_Estado FOREIGN KEY (IdEstadoOferta) REFERENCES EstadoOferta(IdEstadoOferta),
    CONSTRAINT FK_Oferta_Municipio FOREIGN KEY (IdMunicipio) REFERENCES Municipio(IdMunicipio)
);

CREATE TABLE Postulacion (
    IdPostulacion INT AUTO_INCREMENT PRIMARY KEY,
    IdOferta INT NOT NULL,
    IdCandidato INT NOT NULL,
    IdEstadoPostulacion INT NOT NULL,
    Vista BOOLEAN DEFAULT FALSE,
    FechaPostulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Postulacion_Oferta FOREIGN KEY (IdOferta) REFERENCES Oferta(IdOferta) ON DELETE CASCADE,
    CONSTRAINT FK_Postulacion_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT FK_Postulacion_Estado FOREIGN KEY (IdEstadoPostulacion) REFERENCES EstadoPostulacion(IdEstadoPostulacion),
    CONSTRAINT UK_Postulacion UNIQUE (IdOferta, IdCandidato)
);

CREATE TABLE Notificacion (
    IdNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    IdTipoNotificacion INT NOT NULL,
    IdEmpresa INT NULL,
    IdCandidato INT NULL,
    IdAdministrador INT NULL,
    Titulo VARCHAR(150),
    Mensaje TEXT,
    Leida BOOLEAN DEFAULT FALSE,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notificacion_Tipo FOREIGN KEY (IdTipoNotificacion) REFERENCES TipoNotificacion(IdTipoNotificacion),
    CONSTRAINT FK_Notificacion_Empresa FOREIGN KEY (IdEmpresa) REFERENCES Empresa(IdEmpresa) ON DELETE CASCADE,
    CONSTRAINT FK_Notificacion_Candidato FOREIGN KEY (IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT FK_Notificacion_Administrador FOREIGN KEY (IdAdministrador) REFERENCES Administrador(IdAdministrador) ON DELETE CASCADE
);

-- ============================================================
-- UBICACIONES (Datos obligatorios para el registro)
-- ============================================================

INSERT INTO Pais (Nombre) VALUES ('Colombia');

INSERT INTO Departamento (IdPais, Nombre) VALUES
(1, 'Antioquia'), (1, 'Cundinamarca'), (1, 'Valle del Cauca');

INSERT INTO Municipio (IdDepartamento, Nombre) VALUES
(1, 'Medellín'), (1, 'Bello'), (1, 'Itagüí'), (1, 'Envigado'), (1, 'Sabaneta'), (1, 'Rionegro'),
(2, 'Bogotá'), (3, 'Cali');

-- ============================================================
-- ADMINISTRADOR (contraseña de prueba encriptada)
-- ============================================================

-- La contraseña es "admin123" (ya hasheada con bcrypt por el script anterior)
INSERT INTO Usuario (IdRol, IdEstadoUsuario, Correo, Contrasena) VALUES
(1, 1, 'admin@seedwork.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO');

INSERT INTO Administrador (IdUsuario, Nombres, Apellidos, Documento, Telefono) VALUES
(1, 'Andrea', 'Rico', '0000000000', '3000000000');

-- ============================================================
-- DATOS DE PRUEBA: EMPRESAS
-- ============================================================

INSERT INTO Usuario (IdRol, IdEstadoUsuario, Correo, Contrasena) VALUES
(2, 1, 'contacto@happycustomer.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(2, 1, 'contacto@dataup.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(2, 1, 'contacto@techstart.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(2, 1, 'contacto@grupoandina.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO');

-- IdUsuario 2=Happy Customer, 3=Data Up, 4=TechStart Solutions, 5=Grupo Andina
INSERT INTO Empresa (IdUsuario, IdMunicipio, IdSectorEmpresa, IdTamanoEmpresa, NombreEmpresa, NIT, Telefono) VALUES
(2, 1, 1, 3, 'Happy Customer', '900111111-1', '3001112222'),
(3, 1, 1, 3, 'Data Up', '900222222-2', '3002223333'),
(4, 7, 1, 2, 'TechStart Solutions', '900333333-3', '3003334444'),
(5, 8, 4, 2, 'Grupo Andina', '900444444-4', '3004445555');

-- Datos extendidos de ejemplo para "Happy Customer" (IdEmpresa = 1)
UPDATE Empresa
SET
    SitioWeb = 'www.empresa.com',
    CorreoCorporativo = 'empresa@gmail.com',
    Especialidades = 'Desarrollo de software',
    AnioFundacion = 2018,
    Mision = 'Crear soluciones tecnológicas que transformen negocios y vidas.',
    Vision = 'Ser una empresa líder en innovación tecnológica.',
    Direccion = 'Calle 123 #45-65, Medellín - Colombia',
    Telefono = '+57 300 123 4567'
WHERE NombreEmpresa = 'Happy Customer';

-- ============================================================
-- DATOS DE PRUEBA: CANDIDATOS
-- ============================================================

INSERT INTO Usuario (IdRol, IdEstadoUsuario, Correo, Contrasena) VALUES
(3, 1, 'viviana.lopez@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'juan.ramirez@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'camila.mora@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'andrea.perez@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'carlos.ruiz@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'mario.ortega@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'valentina.perez@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'cristian.roman@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'leidy.marquez@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO'),
(3, 1, 'nicolas.rojas@mail.com', '$2b$12$b7mNxZx8UDRvSkqSQXaRMeujI8V85vbCHTcWnrLYXs.q/PdsfSkeO');

-- IdUsuario 6=Viviana, 7=Juan, 8=Camila, 9=Andrea, 10=Carlos,
-- 11=Mario, 12=Valentina, 13=Cristian, 14=Leidy, 15=Nicolás
-- (el bloque original repetía este INSERT dos veces con IdUsuario 11-17,
--  lo que violaba el UNIQUE(IdUsuario); aquí queda una sola vez)
INSERT INTO Candidato (IdUsuario, IdMunicipio, Nombres, Apellidos, Telefono) VALUES
(6, 1, 'Viviana', 'Lopez', '3123456785'),
(7, 7, 'Juan', 'Ramírez', '3123456786'),
(8, 8, 'Camila', 'Mora', '3123456787'),
(9, 1, 'Andrea', 'Pérez', '3001112233'),
(10, 7, 'Carlos', 'Ruiz', '3002223344'),
(11, 1, 'Mario', 'Ortega', '3003334455'),
(12, 8, 'Valentina', 'Pérez', '3004445566'),
(13, 7, 'Cristian', 'Roman', '3005556677'),
(14, 1, 'Leidy', 'Marquez', '3006667788'),
(15, 1, 'Nicolás', 'Rojas', '3007778899');

-- ============================================================
-- DATOS DE PRUEBA: OFERTAS
-- ============================================================

-- Ofertas de las 4 primeras empresas (IdEmpresa 1-4)
INSERT INTO Oferta (IdEmpresa, IdCategoria, IdTipoContrato, IdModalidad, IdJornada, IdEstadoOferta, IdMunicipio, Titulo, Descripcion, Vacantes, ExperienciaMinima) VALUES
(1, 1, 2, 3, 1, 1, 1, 'Desarrollador de Software', 'Desarrollo y diseño de páginas web.', 1, 0),
(2, 1, 2, 2, 1, 1, 1, 'Analista de Datos Jr.', 'Análisis y visualización de datos.', 1, 0),
(3, 8, 4, 1, 4, 1, 7, 'Auxiliar de Soporte Técnico', 'Apoya tareas de soporte técnico.', 2, 0),
(4, 5, 1, 1, 1, 1, 8, 'Coordinador de RRHH', 'Gestión de procesos de talento humano.', 1, 2);

-- Ofertas adicionales para la empresa 1 (IdOferta 5-9), usadas por las postulaciones de prueba
INSERT INTO Oferta (IdEmpresa, IdCategoria, IdTipoContrato, IdModalidad, IdJornada, IdEstadoOferta, IdMunicipio, Titulo, Descripcion, Vacantes, ExperienciaMinima) VALUES
(1, 1, 1, 1, 1, 1, 1, 'Analista de software', 'Análisis y visualización de datos', 1, 0),
(1, 1, 1, 2, 1, 1, 1, 'Practicante de desarrollo web', 'Colabora en proyectos de desarrollo', 1, 0),
(1, 1, 1, 3, 1, 1, 1, 'Desarrollador de Software', 'Desarrollo y diseño de páginas web', 1, 0),
(1, 1, 1, 1, 1, 4, 1, 'Analista de software', 'Análisis y visualización de datos', 1, 0),
(1, 1, 1, 2, 1, 4, 1, 'Practicante de desarrollo web', 'Colabora en proyectos de desarrollo', 1, 0);

-- ============================================================
-- DATOS DE PRUEBA: POSTULACIONES
-- ============================================================

INSERT INTO Postulacion (IdOferta, IdCandidato, IdEstadoPostulacion, Vista) VALUES
(1, 1, 2, FALSE),
(2, 1, 2, TRUE),
(5, 4, 2, FALSE),
(5, 5, 3, TRUE),
(6, 4, 2, FALSE),
(6, 5, 3, TRUE),
(7, 4, 2, FALSE),
(7, 5, 3, TRUE),
(8, 4, 2, FALSE),
(8, 5, 3, TRUE),
(9, 4, 2, FALSE),
(9, 5, 3, TRUE);

-- ============================================================
-- DATOS DE PRUEBA: NOTIFICACIONES (empresa IdEmpresa = 1, Happy Customer)
-- ============================================================

INSERT INTO Notificacion (IdTipoNotificacion, IdEmpresa, Titulo, Mensaje, Leida, Fecha)
VALUES
(2, 1, 'Nueva postulación', 'Andrea Perez se postuló a Desarrollador de Software', FALSE, NOW()),
(1, 1, 'Oferta publicada', 'La oferta "Analista de Datos" ya está activa', FALSE, NOW()),
(3, 1, 'Entrevista programada', 'Entrevista con Carlos Ruiz el 15 de Agosto', TRUE, NOW());

-- Reactivamos las verificaciones que desactivamos al inicio del script.
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;
