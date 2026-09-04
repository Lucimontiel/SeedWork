SET NAMES utf8mb4;

DROP DATABASE IF EXISTS proyectoseedwork;
CREATE DATABASE proyectoseedwork CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE proyectoseedwork;

-- ============================================================
-- CATALOGOS BASE
-- ============================================================

CREATE TABLE Rol(
    IdRol INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(30) NOT NULL UNIQUE,
    Descripcion VARCHAR(150)
);
INSERT INTO Rol(Nombre,Descripcion) VALUES
('Administrador','Administrador del sistema'),
('Empresa','Empresa que publica ofertas'),
('Candidato','Usuario que busca empleo');

CREATE TABLE EstadoUsuario(
    IdEstadoUsuario INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(30) UNIQUE NOT NULL
);
INSERT INTO EstadoUsuario(Nombre) VALUES ('Activo'),('Pendiente'),('Suspendido'),('Bloqueado');

CREATE TABLE Pais(
    IdPais INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Departamento(
    IdDepartamento INT AUTO_INCREMENT PRIMARY KEY,
    IdPais INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Departamento_Pais FOREIGN KEY(IdPais) REFERENCES Pais(IdPais)
);

CREATE TABLE Municipio(
    IdMunicipio INT AUTO_INCREMENT PRIMARY KEY,
    IdDepartamento INT NOT NULL,
    Nombre VARCHAR(120) NOT NULL,
    CONSTRAINT FK_Municipio_Departamento FOREIGN KEY(IdDepartamento) REFERENCES Departamento(IdDepartamento)
);

CREATE TABLE Idioma(
    IdIdioma INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(60) NOT NULL UNIQUE
);
INSERT INTO Idioma(Nombre) VALUES ('Español'),('Inglés'),('Portugués'),('Francés');

CREATE TABLE SectorEmpresa(
    IdSectorEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) NOT NULL UNIQUE
);
INSERT INTO SectorEmpresa(Nombre) VALUES
('Tecnología'),('Educación'),('Salud'),('Finanzas'),('Construcción'),('Otro');

CREATE TABLE TamanoEmpresa(
    IdTamanoEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    Rango VARCHAR(40) NOT NULL UNIQUE
);
INSERT INTO TamanoEmpresa(Rango) VALUES
('1 - 10 Empleados'),('11 - 50 Empleados'),('51 - 200 Empleados'),('201 - 500 Empleados'),('Más de 500 Empleados');

-- ============================================================
-- USUARIOS Y ROLES
-- ============================================================

CREATE TABLE Usuario(
    IdUsuario INT AUTO_INCREMENT PRIMARY KEY,
    IdRol INT NOT NULL,
    IdEstadoUsuario INT NOT NULL,
    Correo VARCHAR(150) NOT NULL UNIQUE,
    Contrasena VARCHAR(255) NOT NULL,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_Usuario_Rol FOREIGN KEY(IdRol) REFERENCES Rol(IdRol),
    CONSTRAINT FK_Usuario_Estado FOREIGN KEY(IdEstadoUsuario) REFERENCES EstadoUsuario(IdEstadoUsuario)
);

CREATE TABLE Administrador(
    IdAdministrador INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL UNIQUE,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Documento VARCHAR(20) UNIQUE,
    Telefono VARCHAR(20),
    CONSTRAINT FK_Admin_Usuario FOREIGN KEY(IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE
);

CREATE TABLE Empresa(
    IdEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL UNIQUE,
    IdMunicipio INT NOT NULL,
    IdSectorEmpresa INT,
    IdTamanoEmpresa INT,
    NombreEmpresa VARCHAR(150) NOT NULL,
    NIT VARCHAR(20) NOT NULL UNIQUE,
    Descripcion TEXT,
    SitioWeb VARCHAR(255),
    Logo VARCHAR(255),
    Direccion VARCHAR(150),
    Telefono VARCHAR(20),
    CorreoCorporativo VARCHAR(150),
    Especialidades VARCHAR(255),
    AnioFundacion INT,
    Mision TEXT,
    Vision TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Empresa_Usuario FOREIGN KEY(IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_Empresa_Municipio FOREIGN KEY(IdMunicipio) REFERENCES Municipio(IdMunicipio),
    CONSTRAINT FK_Empresa_Sector FOREIGN KEY(IdSectorEmpresa) REFERENCES SectorEmpresa(IdSectorEmpresa),
    CONSTRAINT FK_Empresa_Tamano FOREIGN KEY(IdTamanoEmpresa) REFERENCES TamanoEmpresa(IdTamanoEmpresa)
);

CREATE TABLE Modalidad(
    IdModalidad INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO Modalidad(Nombre) VALUES ('Presencial'),('Remoto'),('Híbrido');

CREATE TABLE Disponibilidad(
    IdDisponibilidad INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO Disponibilidad(Nombre) VALUES ('Tiempo Completo'),('Medio Tiempo'),('Por Horas'),('Prácticas');

CREATE TABLE Candidato(
    IdCandidato INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT NOT NULL UNIQUE,
    IdMunicipio INT,
    IdModalidad INT,
    IdDisponibilidad INT,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Documento VARCHAR(20) UNIQUE,
    Telefono VARCHAR(20),
    FechaNacimiento DATE,
    FotoPerfil VARCHAR(255),
    AcercaDe TEXT,
    SalarioEsperado DECIMAL(12,2),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Candidato_Usuario FOREIGN KEY(IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_Candidato_Municipio FOREIGN KEY(IdMunicipio) REFERENCES Municipio(IdMunicipio),
    CONSTRAINT FK_Candidato_Modalidad FOREIGN KEY(IdModalidad) REFERENCES Modalidad(IdModalidad),
    CONSTRAINT FK_Candidato_Disponibilidad FOREIGN KEY(IdDisponibilidad) REFERENCES Disponibilidad(IdDisponibilidad)
);

CREATE TABLE Perfil(
    IdPerfil INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL UNIQUE,
    TituloProfesional VARCHAR(150),
    Descripcion TEXT,
    PlantillaCV ENUM('Clásico','Moderno','Elegante') DEFAULT 'Clásico',
    FechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_Perfil_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE NivelEducativo(
    IdNivelEducativo INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) NOT NULL UNIQUE
);
INSERT INTO NivelEducativo(Nombre) VALUES
('Bachiller'),('Técnico'),('Tecnólogo'),('Profesional'),('Especialización'),('Maestría'),('Doctorado');

CREATE TABLE Educacion(
    IdEducacion INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    IdNivelEducativo INT NOT NULL,
    Institucion VARCHAR(150) NOT NULL,
    TituloObtenido VARCHAR(150),
    FechaInicio DATE,
    FechaFin DATE,
    Estado ENUM('En curso','Finalizado','Suspendido') DEFAULT 'En curso',
    CONSTRAINT FK_Educacion_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT FK_Educacion_Nivel FOREIGN KEY(IdNivelEducativo) REFERENCES NivelEducativo(IdNivelEducativo)
);

CREATE TABLE Experiencia(
    IdExperiencia INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Empresa VARCHAR(150) NOT NULL,
    Cargo VARCHAR(150) NOT NULL,
    Descripcion TEXT,
    FechaInicio DATE,
    FechaFin DATE,
    ActualmenteTrabaja BOOLEAN DEFAULT FALSE,
    CONSTRAINT FK_Experiencia_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE Proyecto(
    IdProyecto INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Descripcion TEXT,
    Tipo ENUM('Académico','Personal','Laboral') DEFAULT 'Académico',
    FechaInicio DATE,
    FechaFin DATE,
    UrlProyecto VARCHAR(255),
    CONSTRAINT FK_Proyecto_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE Certificacion(
    IdCertificacion INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Institucion VARCHAR(150),
    FechaObtencion DATE,
    UrlCertificado VARCHAR(255),
    CONSTRAINT FK_Certificacion_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE HojaVida(
    IdHojaVida INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    ArchivoPDF VARCHAR(255) NOT NULL,
    NombreArchivo VARCHAR(150),
    FechaSubida DATETIME DEFAULT CURRENT_TIMESTAMP,
    Activa BOOLEAN DEFAULT TRUE,
    CONSTRAINT FK_HojaVida_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE Habilidad(
    IdHabilidad INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE PerfilHabilidad(
    IdPerfil INT NOT NULL,
    IdHabilidad INT NOT NULL,
    Nivel ENUM('Básico','Intermedio','Avanzado') DEFAULT 'Intermedio',
    PRIMARY KEY(IdPerfil,IdHabilidad),
    CONSTRAINT FK_PerfilHabilidad_Perfil FOREIGN KEY(IdPerfil) REFERENCES Perfil(IdPerfil) ON DELETE CASCADE,
    CONSTRAINT FK_PerfilHabilidad_Habilidad FOREIGN KEY(IdHabilidad) REFERENCES Habilidad(IdHabilidad) ON DELETE CASCADE
);

CREATE TABLE CandidatoIdioma(
    IdCandidato INT NOT NULL,
    IdIdioma INT NOT NULL,
    Nivel ENUM('A1','A2','B1','B2','C1','C2','Nativo') DEFAULT 'A1',
    PRIMARY KEY(IdCandidato,IdIdioma),
    CONSTRAINT FK_CandidatoIdioma_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT FK_CandidatoIdioma_Idioma FOREIGN KEY(IdIdioma) REFERENCES Idioma(IdIdioma) ON DELETE CASCADE
);

CREATE TABLE ReferenciaLaboral(
    IdReferencia INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    Nombre VARCHAR(120) NOT NULL,
    Cargo VARCHAR(120),
    Empresa VARCHAR(120),
    Telefono VARCHAR(20),
    Correo VARCHAR(150),
    Tipo ENUM('Laboral','Personal','Académica') DEFAULT 'Laboral',
    CONSTRAINT FK_Referencia_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

-- ============================================================
-- OFERTAS
-- ============================================================

CREATE TABLE CategoriaOferta(
    IdCategoria INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Descripcion VARCHAR(250)
);
INSERT INTO CategoriaOferta(Nombre) VALUES
('Desarrollo de Software'),('Diseño Gráfico'),('Marketing'),('Administración'),
('Recursos Humanos'),('Contabilidad'),('Ventas'),('Atención al Cliente'),('Logística'),('Salud');

CREATE TABLE TipoContrato(
    IdTipoContrato INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO TipoContrato(Nombre) VALUES
('Término Fijo'),('Término Indefinido'),('Prestación de Servicios'),('Aprendizaje'),('Temporal');

CREATE TABLE JornadaLaboral(
    IdJornada INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO JornadaLaboral(Nombre) VALUES ('Tiempo Completo'),('Medio Tiempo'),('Por Horas'),('Flexible');

CREATE TABLE EstadoOferta(
    IdEstadoOferta INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO EstadoOferta(Nombre) VALUES
('Borrador'),('Por aprobar'),('Publicada'),('Pausada'),('Rechazada'),('Cerrada');

CREATE TABLE Oferta(
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
    SalarioMin DECIMAL(12,2),
    SalarioMax DECIMAL(12,2),
    ExperienciaMinima INT DEFAULT 0,
    FechaPublicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FechaCierre DATE,
    CONSTRAINT FK_Oferta_Empresa FOREIGN KEY(IdEmpresa) REFERENCES Empresa(IdEmpresa),
    CONSTRAINT FK_Oferta_Categoria FOREIGN KEY(IdCategoria) REFERENCES CategoriaOferta(IdCategoria),
    CONSTRAINT FK_Oferta_Contrato FOREIGN KEY(IdTipoContrato) REFERENCES TipoContrato(IdTipoContrato),
    CONSTRAINT FK_Oferta_Modalidad FOREIGN KEY(IdModalidad) REFERENCES Modalidad(IdModalidad),
    CONSTRAINT FK_Oferta_Jornada FOREIGN KEY(IdJornada) REFERENCES JornadaLaboral(IdJornada),
    CONSTRAINT FK_Oferta_Estado FOREIGN KEY(IdEstadoOferta) REFERENCES EstadoOferta(IdEstadoOferta),
    CONSTRAINT FK_Oferta_Municipio FOREIGN KEY(IdMunicipio) REFERENCES Municipio(IdMunicipio)
);

CREATE TABLE EstadoPostulacion(
    IdEstadoPostulacion INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE NOT NULL
);
INSERT INTO EstadoPostulacion(Nombre) VALUES
('Postulado'),('En revisión'),('Preseleccionado'),('Entrevista'),('Prueba Técnica'),('Contratado'),('Rechazado');

CREATE TABLE Postulacion(
    IdPostulacion INT AUTO_INCREMENT PRIMARY KEY,
    IdOferta INT NOT NULL,
    IdCandidato INT NOT NULL,
    IdEstadoPostulacion INT NOT NULL,
    Vista BOOLEAN DEFAULT FALSE,
    FechaVista DATETIME NULL,
    FechaPostulacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ObservacionesEmpresa TEXT,
    CONSTRAINT FK_Postulacion_Oferta FOREIGN KEY(IdOferta) REFERENCES Oferta(IdOferta) ON DELETE CASCADE,
    CONSTRAINT FK_Postulacion_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT FK_Postulacion_Estado FOREIGN KEY(IdEstadoPostulacion) REFERENCES EstadoPostulacion(IdEstadoPostulacion),
    CONSTRAINT UK_Postulacion UNIQUE(IdOferta,IdCandidato)
);

CREATE TABLE Favorito(
    IdFavorito INT AUTO_INCREMENT PRIMARY KEY,
    IdOferta INT NOT NULL,
    IdCandidato INT NOT NULL,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Favorito_Oferta FOREIGN KEY(IdOferta) REFERENCES Oferta(IdOferta) ON DELETE CASCADE,
    CONSTRAINT FK_Favorito_Candidato FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT UK_Favorito UNIQUE(IdOferta,IdCandidato)
);

CREATE TABLE Etiqueta(
    IdEtiqueta INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE
);
INSERT INTO Etiqueta(Nombre) VALUES
('Junior'),('Prácticas'),('Remoto'),('Sin experiencia'),('Tiempo completo'),('Tecnología'),('SENA'),('Capacitación'),('Estudiante');

CREATE TABLE OfertaEtiqueta(
    IdOferta INT,
    IdEtiqueta INT,
    PRIMARY KEY(IdOferta,IdEtiqueta),
    CONSTRAINT FK_OfertaEtiqueta_Oferta FOREIGN KEY(IdOferta) REFERENCES Oferta(IdOferta) ON DELETE CASCADE,
    CONSTRAINT FK_OfertaEtiqueta_Etiqueta FOREIGN KEY(IdEtiqueta) REFERENCES Etiqueta(IdEtiqueta) ON DELETE CASCADE
);

CREATE TABLE Requisito(
    IdRequisito INT AUTO_INCREMENT PRIMARY KEY,
    IdOferta INT NOT NULL,
    Descripcion VARCHAR(250) NOT NULL,
    Obligatorio BOOLEAN DEFAULT TRUE,
    CONSTRAINT FK_Requisito_Oferta FOREIGN KEY(IdOferta) REFERENCES Oferta(IdOferta) ON DELETE CASCADE
);

CREATE TABLE Beneficio(
    IdBeneficio INT AUTO_INCREMENT PRIMARY KEY,
    IdOferta INT NOT NULL,
    Descripcion VARCHAR(200),
    CONSTRAINT FK_Beneficio_Oferta FOREIGN KEY(IdOferta) REFERENCES Oferta(IdOferta) ON DELETE CASCADE
);

-- ============================================================
-- SIMULADOR DE ENTREVISTA
-- ============================================================

CREATE TABLE TipoEntrevista(
    IdTipoEntrevista INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Descripcion VARCHAR(250)
);
INSERT INTO TipoEntrevista(Nombre,Descripcion) VALUES
('General','Entrevista de ingreso'),
('Desarrollo de Software','Entrevista técnica de programación'),
('Diseño UX/UI','Entrevista para perfiles de diseño de producto'),
('Marketing','Entrevista para mercadeo'),
('Ventas','Entrevista para el área comercial'),
('Atención al Cliente','Entrevista para servicio y soporte al cliente');

CREATE TABLE Simulador(
    IdSimulador INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL,
    IdTipoEntrevista INT NOT NULL,
    Cargo VARCHAR(120),
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    DuracionMinutos INT,
    Estado ENUM('En proceso','Finalizada','Cancelada') DEFAULT 'En proceso',
    FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    FOREIGN KEY(IdTipoEntrevista) REFERENCES TipoEntrevista(IdTipoEntrevista)
);

CREATE TABLE Pregunta(
    IdPregunta INT AUTO_INCREMENT PRIMARY KEY,
    IdTipoEntrevista INT NOT NULL,
    Pregunta TEXT NOT NULL,
    Dificultad ENUM('Básica','Media','Avanzada') DEFAULT 'Media',
    FOREIGN KEY(IdTipoEntrevista) REFERENCES TipoEntrevista(IdTipoEntrevista)
);

CREATE TABLE Respuesta(
    IdRespuesta INT AUTO_INCREMENT PRIMARY KEY,
    IdSimulador INT NOT NULL,
    IdPregunta INT NOT NULL,
    DuracionSegundos INT,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(IdSimulador) REFERENCES Simulador(IdSimulador) ON DELETE CASCADE,
    FOREIGN KEY(IdPregunta) REFERENCES Pregunta(IdPregunta)
);

CREATE TABLE EvaluacionIA(
    IdEvaluacion INT AUTO_INCREMENT PRIMARY KEY,
    IdRespuesta INT NOT NULL,
    Puntaje DECIMAL(5,2),
    Comunicacion DECIMAL(5,2),
    Seguridad DECIMAL(5,2),
    Claridad DECIMAL(5,2),
    Retroalimentacion TEXT,
    Recomendaciones TEXT,
    FOREIGN KEY(IdRespuesta) REFERENCES Respuesta(IdRespuesta) ON DELETE CASCADE
);

-- ============================================================
-- CONFIGURACION Y NOTIFICACIONES
-- ============================================================

CREATE TABLE Configuracion(
    IdConfiguracion INT AUTO_INCREMENT PRIMARY KEY,
    IdCandidato INT NOT NULL UNIQUE,
    Tema ENUM('Claro','Oscuro') DEFAULT 'Claro',
    AltoContraste BOOLEAN DEFAULT FALSE,
    ReducirAnimaciones BOOLEAN DEFAULT FALSE,
    TamanoFuente ENUM('Pequeña','Normal','Grande') DEFAULT 'Normal',
    FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE
);

CREATE TABLE TipoNotificacion(
    IdTipoNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) UNIQUE
);
INSERT INTO TipoNotificacion(Nombre) VALUES
('Nueva Oferta'),('Nueva Postulación'),('Entrevista'),('IA'),('Sistema'),('Reporte');

CREATE TABLE PreferenciaNotificacion(
    IdUsuario INT NOT NULL,
    IdTipoNotificacion INT NOT NULL,
    Activa BOOLEAN DEFAULT TRUE,
    PRIMARY KEY(IdUsuario,IdTipoNotificacion),
    CONSTRAINT FK_PreferenciaNotificacion_Usuario FOREIGN KEY(IdUsuario) REFERENCES Usuario(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_PreferenciaNotificacion_Tipo FOREIGN KEY(IdTipoNotificacion) REFERENCES TipoNotificacion(IdTipoNotificacion) ON DELETE CASCADE
);

CREATE TABLE Notificacion(
    IdNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    IdTipoNotificacion INT NOT NULL,
    IdEmpresa INT NULL,
    IdCandidato INT NULL,
    IdAdministrador INT NULL,
    Titulo VARCHAR(150),
    Mensaje TEXT,
    Leida BOOLEAN DEFAULT FALSE,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(IdTipoNotificacion) REFERENCES TipoNotificacion(IdTipoNotificacion),
    FOREIGN KEY(IdEmpresa) REFERENCES Empresa(IdEmpresa) ON DELETE CASCADE,
    FOREIGN KEY(IdCandidato) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    FOREIGN KEY(IdAdministrador) REFERENCES Administrador(IdAdministrador) ON DELETE CASCADE
);

CREATE TABLE Consejo(
    IdConsejo INT AUTO_INCREMENT PRIMARY KEY,
    Categoria ENUM('Hoja de Vida','Entrevista','Comunicación','Habilidades Blandas','Primer Empleo'),
    Titulo VARCHAR(150),
    Contenido TEXT
);

-- ============================================================
-- MODERACION / PANEL ADMINISTRADOR
-- ============================================================

CREATE TABLE EstadoReporte(
    IdEstadoReporte INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO EstadoReporte(Nombre) VALUES ('Abierto'),('En revisión'),('Cerrado'),('Descartado');

CREATE TABLE Reporte(
    IdReporte INT AUTO_INCREMENT PRIMARY KEY,
    IdUsuarioReporta INT NOT NULL,
    IdEstadoReporte INT NOT NULL,
    IdOfertaReportada INT NULL,
    IdCandidatoReportado INT NULL,
    IdEmpresaReportada INT NULL,
    Motivo VARCHAR(250) NOT NULL,
    Detalle TEXT,
    Resolucion TEXT,
    FechaApertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    FechaCierre DATETIME NULL,
    CONSTRAINT FK_Reporte_UsuarioReporta FOREIGN KEY(IdUsuarioReporta) REFERENCES Usuario(IdUsuario),
    CONSTRAINT FK_Reporte_Estado FOREIGN KEY(IdEstadoReporte) REFERENCES EstadoReporte(IdEstadoReporte),
    CONSTRAINT FK_Reporte_Oferta FOREIGN KEY(IdOfertaReportada) REFERENCES Oferta(IdOferta) ON DELETE CASCADE,
    CONSTRAINT FK_Reporte_Candidato FOREIGN KEY(IdCandidatoReportado) REFERENCES Candidato(IdCandidato) ON DELETE CASCADE,
    CONSTRAINT FK_Reporte_Empresa FOREIGN KEY(IdEmpresaReportada) REFERENCES Empresa(IdEmpresa) ON DELETE CASCADE
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IDX_Usuario_Correo ON Usuario(Correo);
CREATE INDEX IDX_Empresa_Nombre ON Empresa(NombreEmpresa);
CREATE INDEX IDX_Empresa_NIT ON Empresa(NIT);
CREATE INDEX IDX_Candidato_Nombre ON Candidato(Nombres,Apellidos);
CREATE INDEX IDX_Oferta_Titulo ON Oferta(Titulo);
CREATE INDEX IDX_Oferta_Categoria ON Oferta(IdCategoria);
CREATE INDEX IDX_Oferta_Municipio ON Oferta(IdMunicipio);
CREATE INDEX IDX_Oferta_Estado ON Oferta(IdEstadoOferta);
CREATE INDEX IDX_Oferta_Empresa ON Oferta(IdEmpresa);
CREATE INDEX IDX_Postulacion_Candidato ON Postulacion(IdCandidato);
CREATE INDEX IDX_Postulacion_Oferta ON Postulacion(IdOferta);
CREATE INDEX IDX_Postulacion_Estado ON Postulacion(IdEstadoPostulacion);
CREATE INDEX IDX_Notificacion_Candidato ON Notificacion(IdCandidato);
CREATE INDEX IDX_Notificacion_Empresa ON Notificacion(IdEmpresa);
CREATE INDEX IDX_Reporte_Estado ON Reporte(IdEstadoReporte);

-- ============================================================
-- VISTAS
-- ============================================================

CREATE VIEW VistaOfertasActivas AS
SELECT o.IdOferta, o.Titulo, e.NombreEmpresa, m.Nombre AS Ciudad, c.Nombre AS Categoria,
       o.SalarioMin, o.SalarioMax, o.FechaPublicacion
FROM Oferta o
INNER JOIN Empresa e ON o.IdEmpresa=e.IdEmpresa
INNER JOIN Municipio m ON o.IdMunicipio=m.IdMunicipio
INNER JOIN CategoriaOferta c ON o.IdCategoria=c.IdCategoria
INNER JOIN EstadoOferta eo ON o.IdEstadoOferta=eo.IdEstadoOferta
WHERE eo.Nombre='Publicada';

CREATE VIEW VistaPostulaciones AS
SELECT p.IdPostulacion, ca.Nombres, ca.Apellidos, o.Titulo, ep.Nombre AS Estado, p.FechaPostulacion
FROM Postulacion p
INNER JOIN Candidato ca ON p.IdCandidato=ca.IdCandidato
INNER JOIN Oferta o ON p.IdOferta=o.IdOferta
INNER JOIN EstadoPostulacion ep ON p.IdEstadoPostulacion=ep.IdEstadoPostulacion;

CREATE VIEW VistaEmpresas AS
SELECT e.IdEmpresa, e.NombreEmpresa, m.Nombre AS Ciudad, u.Correo
FROM Empresa e
INNER JOIN Usuario u ON e.IdUsuario=u.IdUsuario
INNER JOIN Municipio m ON e.IdMunicipio=m.IdMunicipio;

CREATE VIEW VistaCandidatos AS
SELECT c.IdCandidato, c.Nombres, c.Apellidos, u.Correo, m.Nombre AS Ciudad
FROM Candidato c
INNER JOIN Usuario u ON c.IdUsuario=u.IdUsuario
LEFT JOIN Municipio m ON c.IdMunicipio=m.IdMunicipio;

CREATE VIEW VistaReportesAbiertos AS
SELECT r.IdReporte, r.Motivo, er.Nombre AS Estado, r.FechaApertura,
       o.Titulo AS OfertaReportada, emp.NombreEmpresa AS EmpresaReportada,
       CONCAT(can.Nombres,' ',can.Apellidos) AS CandidatoReportado
FROM Reporte r
INNER JOIN EstadoReporte er ON r.IdEstadoReporte=er.IdEstadoReporte
LEFT JOIN Oferta o ON r.IdOfertaReportada=o.IdOferta
LEFT JOIN Empresa emp ON r.IdEmpresaReportada=emp.IdEmpresa
LEFT JOIN Candidato can ON r.IdCandidatoReportado=can.IdCandidato
WHERE er.Nombre IN ('Abierto','En revisión');

-- ============================================================
-- DATOS BASE (ubicaciones)
-- ============================================================

INSERT INTO Pais(Nombre) VALUES ('Colombia');

INSERT INTO Departamento(IdPais,Nombre) VALUES
(1,'Antioquia'),(1,'Cundinamarca'),(1,'Valle del Cauca');

INSERT INTO Municipio(IdDepartamento,Nombre) VALUES
(1,'Medellín'),(1,'Bello'),(1,'Itagüí'),(1,'Envigado'),(1,'Sabaneta'),(1,'Rionegro'),
(2,'Bogotá'),
(3,'Cali');

-- ============================================================
-- HABILIDADES / ETIQUETAS DE REFERENCIA
-- ============================================================

INSERT INTO Habilidad(Nombre) VALUES
('Trabajo en equipo'),('Comunicación'),('Liderazgo'),('Python'),('Java'),('JavaScript'),
('HTML'),('CSS'),('React'),('Next.js'),('FastAPI'),('MySQL'),('Git'),('GitHub'),
('SQL'),('Resolución de problemas'),('Excel'),('Microsoft Office');

-- ============================================================
-- CONSEJOS (contenido estático mostrado en Candidato / Consejos)
-- ============================================================

INSERT INTO Consejo(Categoria,Titulo,Contenido) VALUES
('Primer Empleo','Completa tu perfil','Los perfiles completos reciben más visualizaciones.'),
('Entrevista','Escucha atentamente','Antes de responder, comprende completamente la pregunta.'),
('Comunicación','Habla con confianza','Expresa tus ideas de forma clara y segura.');

-- ============================================================
-- USUARIO ADMINISTRADOR
-- ============================================================

INSERT INTO Usuario(IdRol,IdEstadoUsuario,Correo,Contrasena) VALUES
(1,1,'admin@seedwork.com','$2b$12$CambiarPorHashJWT');

INSERT INTO Administrador(IdUsuario,Nombres,Apellidos,Documento,Telefono) VALUES
(1,'Andrea','Rico','0000000000','3000000000');

-- ============================================================
-- DATOS DE PRUEBA (coherentes con los mockups de Candidato /
-- Empresa / Administrador ya construidos en HTML)
-- ============================================================

-- Empresas (usuarios + empresas)
INSERT INTO Usuario(IdRol,IdEstadoUsuario,Correo,Contrasena) VALUES
(2,1,'contacto@happycustomer.com','$2b$12$CambiarPorHashReal'),
(2,1,'contacto@dataup.com','$2b$12$CambiarPorHashReal'),
(2,2,'contacto@techstart.com','$2b$12$CambiarPorHashReal'),
(2,1,'contacto@grupoandina.com','$2b$12$CambiarPorHashReal');

INSERT INTO Empresa(IdUsuario,IdMunicipio,IdSectorEmpresa,IdTamanoEmpresa,NombreEmpresa,NIT,Descripcion,Direccion,Telefono,CorreoCorporativo) VALUES
(2,1,1,3,'Happy Customer','900111111-1','Servicios de atención y experiencia al cliente.','Medellín, Antioquia','3001112222','empresa@happycustomer.com'),
(3,1,1,3,'Data Up','900222222-2','Analítica y visualización de datos para empresas.','Medellín, Antioquia','3002223333','empresa@dataup.com'),
(4,7,1,2,'TechStart Solutions','900333333-3','Soporte técnico y soluciones tecnológicas.','Bogotá, Colombia','3003334444','empresa@techstart.com'),
(5,8,4,2,'Grupo Andina','900444444-4','Consultoría administrativa y de recursos humanos.','Cali, Valle del Cauca','3004445555','empresa@grupoandina.com');

-- Candidatos (usuarios + candidatos)
INSERT INTO Usuario(IdRol,IdEstadoUsuario,Correo,Contrasena) VALUES
(3,1,'viviana.lopez@mail.com','$2b$12$CambiarPorHashReal'),
(3,1,'juan.ramirez@mail.com','$2b$12$CambiarPorHashReal'),
(3,3,'camila.mora@mail.com','$2b$12$CambiarPorHashReal');

INSERT INTO Candidato(IdUsuario,IdMunicipio,IdModalidad,IdDisponibilidad,Nombres,Apellidos,Telefono) VALUES
(6,1,3,1,'Viviana','Lopez','3123456785'),
(7,7,1,1,'Juan','Ramírez','3123456786'),
(8,8,1,1,'Camila','Mora','3123456787');

INSERT INTO Perfil(IdCandidato,TituloProfesional,Descripcion,PlantillaCV) VALUES
(1,'Desarrolladora de Software','Apasionada por la tecnología y el aprendizaje continuo.','Clásico');

-- Ofertas
INSERT INTO Oferta(IdEmpresa,IdCategoria,IdTipoContrato,IdModalidad,IdJornada,IdEstadoOferta,IdMunicipio,Titulo,Descripcion,Vacantes,ExperienciaMinima) VALUES
(1,1,2,3,1,3,1,'Desarrollador de Software','Desarrollo y diseño de páginas web.',1,0),
(2,1,2,2,1,2,1,'Analista de Datos Jr.','Análisis y visualización de datos.',1,0),
(3,8,4,1,4,3,7,'Auxiliar de Soporte Técnico','Apoya tareas de soporte técnico.',2,0),
(4,5,1,1,1,3,8,'Coordinador de RRHH','Gestión de procesos de talento humano.',1,2);

-- Postulaciones (coherentes con el dashboard de Viviana Lopez)
INSERT INTO Postulacion(IdOferta,IdCandidato,IdEstadoPostulacion,Vista,FechaVista) VALUES
(1,1,2,FALSE,NULL),
(2,1,2,TRUE,NOW());

-- Reporte (coherente con el caso #0231 del panel Administrador)
INSERT INTO Reporte(IdUsuarioReporta,IdEstadoReporte,IdOfertaReportada,Motivo,Detalle) VALUES
(6,1,2,'Vacante engañosa','Un candidato reportó la vacante "Analista de Datos Jr." de Data Up como engañosa.');

