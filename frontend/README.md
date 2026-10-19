<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# 🌱 SeedWork

**SeedWork** es una plataforma web orientada a conectar personas que buscan su primera oportunidad laboral con empresas que ofrecen vacantes de nivel inicial.

El proyecto está diseñado especialmente para **estudiantes, recién graduados y personas sin experiencia laboral**, brindándoles no solo acceso a oportunidades de empleo, sino también herramientas para prepararse para el mundo laboral.

> **Sembramos oportunidades donde antes solo había incertidumbre.**

---

## 📌 Descripción

SeedWork busca solucionar una problemática frecuente:

> **Las empresas solicitan experiencia, pero muchas personas no tienen una primera oportunidad para adquirirla.**

La plataforma permite que los candidatos creen su perfil, consulten vacantes, se postulen y preparen herramientas importantes para su proceso de búsqueda laboral.

Por otro lado, las empresas pueden registrar su información, publicar vacantes y gestionar candidatos.

Además, el sistema cuenta con un módulo administrativo para supervisar usuarios, empresas, vacantes, postulaciones y reportes.

---

## 🎯 Objetivo

Desarrollar una plataforma web que facilite la conexión entre:

* 👤 Candidatos sin experiencia laboral.
* 🏢 Empresas con oportunidades de nivel inicial.
* 🛠️ Administradores encargados de gestionar la plataforma.

---

## ✨ Funcionalidades

### 👤 Candidato

* Registro e inicio de sesión.
* Creación y edición del perfil.
* Consulta de vacantes.
* Búsqueda de oportunidades laborales.
* Postulación a vacantes.
* Consulta del estado de las postulaciones.
* Creación de hoja de vida.
* Descarga de CV en PDF.
* Consejos para elaborar un buen CV.
* Consejos para entrevistas.
* Simulador de entrevistas.
* Consejos sobre habilidades importantes.
* Gestión de notificaciones.
* Configuración de la cuenta.

### 🏢 Empresa

* Registro de empresa.
* Inicio de sesión.
* Creación y edición del perfil empresarial.
* Publicación de vacantes.
* Gestión de ofertas laborales.
* Consulta de candidatos.
* Gestión de postulaciones.
* Notificaciones.
* Configuración de la cuenta.

### 🔐 Administrador

* Inicio de sesión administrativo.
* Dashboard.
* Gestión de usuarios.
* Gestión de empresas.
* Gestión de vacantes.
* Gestión de postulaciones.
* Reportes.
* Categorías.
* Notificaciones.
* Configuración.
* Auditoría.
* Gestión de seguridad.

---

## 🛠️ Tecnologías utilizadas

### Frontend

* **Next.js**
* **React**
* **TypeScript**
* **HTML5**
* **CSS3**
* **JavaScript**

### Backend

* **Python**
* **FastAPI**
* **Uvicorn**

### Base de datos

* **MySQL**
* **MySQL Workbench**

### Control de versiones

* **Git**
* **GitLab**

---

## 📂 Estructura del proyecto

```text
SeedWork/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── registro/
│   │   │
│   │   ├── candidato/
│   │   │   ├── inicio/
│   │   │   ├── perfil/
│   │   │   ├── mi-cv/
│   │   │   ├── vacantes/
│   │   │   ├── postulaciones/
│   │   │   ├── consejos/
│   │   │   ├── simulador/
│   │   │   └── configuracion/
│   │   │
│   │   ├── empresa/
│   │   │   ├── inicio/
│   │   │   ├── perfil/
│   │   │   ├── mis-ofertas/
│   │   │   ├── candidatos/
│   │   │   ├── notificaciones/
│   │   │   └── configuracion/
│   │   │
│   │   └── administrador/
│   │       ├── inicio/
│   │       ├── usuarios/
│   │       ├── empresas/
│   │       ├── vacantes/
│   │       ├── postulaciones/
│   │       ├── reportes/
│   │       ├── notificaciones/
│   │       └── configuracion/
│   │
│   ├── public/
│   ├── package.json
│   └── ...
│
├── database/
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

---

# 🚀 Instalación

## 1. Clonar el repositorio

```bash
git clone https://gitlab.com/viviana-group/seedwork.git
```

Ingresar a la carpeta:

```bash
cd seedwork
```

---

# 🗄️ Configuración de la base de datos

Para ejecutar SeedWork es necesario tener instalado **MySQL Server**.

También se recomienda utilizar **MySQL Workbench** para administrar la base de datos.

Crear una base de datos llamada:

```sql
CREATE DATABASE seedwork;
```

Después ejecutar el script SQL del proyecto para crear las tablas y relaciones correspondientes.

---

# ⚙️ Configuración del Backend

Ingresar a la carpeta:

```bash
cd backend
```

Crear un entorno virtual:

```bash
python -m venv venv
```

Activar el entorno virtual en Windows:

```bash
venv\Scripts\activate
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```
>>>>>>> b1e535b0a0acd0c1d8ea2535526da4a5cb74eb74
