"use client";

import { useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import GuideModal from "./GuideModal";
import { GUIDES, GuideKey } from "./guides-data";

const CARD_COLOR: Record<GuideKey, "blue" | "green" | "purple"> = {
  cv: "blue",
  interview: "green",
  skills: "purple",
};

export default function ConsejosCandidatoPage() {
  const { candidato } = useCandidato();
  const [openKey, setOpenKey] = useState<GuideKey | null>(null);

  return (
    <CandidatoShell
      nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : undefined}
      fotoUrl={candidato?.fotoUrl}
      pageTitle="Consejos"
      pageSubtitle="Recursos para impulsar tu búsqueda de empleo"
    >
      <h2 className="section-title" style={{ fontSize: 22, marginBottom: 6 }}>
        Guías de empleabilidad
      </h2>
      <p className="section-subtitle">
        Aprende a crear un CV profesional, prepárate para entrevistas y desarrollar las habilidades más buscadas
      </p>

      <div className="consejos-grid">
        {(Object.keys(GUIDES) as GuideKey[]).map((key) => {
          const g = GUIDES[key];
          const color = CARD_COLOR[key];

          return (
            <div className="consejo-card" key={key}>
              <div className={`consejo-icon consejo-icon-${color}`}>{g.iconSvg}</div>
              <h3>{g.title}</h3>

              {key !== "skills" ? (
                <ul className="consejo-checklist">
                  {g.checklist.map((item) => (
                    <li key={item}>
                      <svg className={`check-icon check-${color}`} viewBox="0 0 20 20">
                        <path d="M4 10.5l4 4 8-8" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="skills-tags-wrap">
                  {g.checklist.map((tag, i) => (
                    <span className="skill-tag-purple" key={`${tag}-${i}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                className={`consejo-btn consejo-btn-${color}`}
                type="button"
                onClick={() => setOpenKey(key)}
              >
                {g.ctaLabel}
                <svg viewBox="0 0 20 20">
                  <path d="M8 5l5 5-5 5" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <GuideModal openKey={openKey} onClose={() => setOpenKey(null)} />
    </CandidatoShell>
  );
}