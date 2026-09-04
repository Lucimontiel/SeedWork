"use client";

import { useEffect } from "react";
import { GUIDES, GuideKey } from "./guides-data";

interface GuideModalProps {
  openKey: GuideKey | null;
  onClose: () => void;
}

export default function GuideModal({ openKey, onClose }: GuideModalProps) {
  useEffect(() => {
    if (!openKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openKey, onClose]);

  if (!openKey) return null;
  const guide = GUIDES[openKey];

  return (
    <div
      className="guide-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`guide-modal ${guide.theme}`}>
        <div className="guide-modal-header">
          <div className={`guide-modal-icon ${guide.iconClass}`}>{guide.iconSvg}</div>
          <div className="guide-modal-heading">
            <h2>{guide.title}</h2>
            <p>{guide.subtitle}</p>
          </div>
          <button className="guide-modal-close" type="button" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="guide-modal-body" dangerouslySetInnerHTML={{ __html: guide.bodyHtml }} />
      </div>
    </div>
  );
}