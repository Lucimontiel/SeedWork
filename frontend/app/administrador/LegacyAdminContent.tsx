"use client";

import { useEffect } from "react";

/**
 * Renderiza HTML "tal cual" (idéntico al mockup original) y reconecta las
 * funciones globales que usan los botones (onClick="funcion()") del
 * script.js original: aprobar/rechazar, verificar, casos, tabs, tema, etc.
 *
 * Es la forma más segura de portar páginas que no necesitan datos reales
 * de la API sin tener que reescribir cada interacción como estado de React.
 */
export default function LegacyAdminContent({ html }: { html: string }) {
  useEffect(() => {
    const w = window as any;

    w.showToast = function (msg: string) {
      const wrap = document.getElementById("toast-wrap");
      if (!wrap) return;
      const t = document.createElement("div");
      t.className = "toast";
      t.textContent = msg;
      wrap.appendChild(t);
      requestAnimationFrame(() => t.classList.add("show"));
      setTimeout(() => {
        t.classList.remove("show");
        setTimeout(() => t.remove(), 300);
      }, 3200);
    };

    w.bumpStat = function (id: string, delta: number) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = String(Math.max(0, parseInt(el.textContent || "0", 10) + delta));
    };

    w.fadeOutRow = function (rowId: string) {
      const row = document.getElementById(rowId);
      if (!row) return;
      row.classList.add("leaving");
      setTimeout(() => row.remove(), 380);
    };

    w.approveVacante = function () {
      const badge = document.getElementById("row-vacante-badge");
      if (badge) badge.outerHTML = '<span class="badge badge-green">Publicada</span>';
      document.querySelectorAll("#row-vacante-actions button").forEach((b: any) => (b.disabled = true));
      w.bumpStat("stat-vacantes-pendientes", -1);
      w.showToast('Vacante "Analista de Datos Jr." aprobada y publicada');
      setTimeout(() => w.fadeOutRow("row-vacante"), 1400);
    };

    w.rejectVacante = function () {
      const badge = document.getElementById("row-vacante-badge");
      if (badge) badge.outerHTML = '<span class="badge badge-red">Rechazada</span>';
      document.querySelectorAll("#row-vacante-actions button").forEach((b: any) => (b.disabled = true));
      w.bumpStat("stat-vacantes-pendientes", -1);
      w.showToast("Vacante rechazada. Se notificó a Data Up");
      setTimeout(() => w.fadeOutRow("row-vacante"), 1400);
    };

    w.verifyEmpresa = function () {
      const badge = document.getElementById("row-empresa-badge");
      if (badge) badge.outerHTML = '<span class="badge badge-green">Verificada</span>';
      const btn = document.getElementById("btn-verificar");
      if (btn) btn.remove();
      w.showToast("TechStart Solutions fue verificada");
    };

    w.openCaseModal = function () {
      document.getElementById("case-modal")?.classList.add("open");
    };
    w.closeCaseModal = function () {
      document.getElementById("case-modal")?.classList.remove("open");
    };
    w.resolveCase = function (type: string) {
      w.closeCaseModal();
      const label = type === "descartado" ? "Descartado" : "Cerrado";
      const badge = document.getElementById("row-reporte-badge");
      if (badge) badge.outerHTML = `<span class="badge badge-green">${label}</span>`;
      const actionBtn = document.querySelector("#row-reporte-actions button");
      if (actionBtn) actionBtn.remove();
      w.bumpStat("stat-reportes-activos", -1);
      w.showToast(type === "descartado" ? "Reporte descartado" : "Caso #0231 cerrado");
      setTimeout(() => w.fadeOutRow("row-reporte"), 1400);
    };

    w.switchUserTab = function (tab: string) {
      const tabCandidatos = document.getElementById("tab-candidatos");
      const tabEmpresas = document.getElementById("tab-empresas");
      const tableCandidatos = document.getElementById("table-candidatos") as HTMLElement;
      const tableEmpresas = document.getElementById("table-empresas") as HTMLElement;
      if (!tabCandidatos) return;
      tabCandidatos.classList.toggle("active", tab === "candidatos");
      tabEmpresas?.classList.toggle("active", tab === "empresas");
      tableCandidatos.style.display = tab === "candidatos" ? "" : "none";
      tableEmpresas.style.display = tab === "empresas" ? "" : "none";
    };

    w.setTheme = function (el: HTMLElement, mode: string) {
      el.parentElement?.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      el.classList.add("active");
      w.showToast(mode === "oscuro" ? "Modo oscuro seleccionado (vista previa próximamente)" : "Modo claro seleccionado");
    };
  }, []);

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
