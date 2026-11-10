"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  isDestructive = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="cv-form-modal-backdrop" style={{ zIndex: 9999 }} onClick={onCancel}>
      <div className="cv-form-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="cv-form-modal-header">
          <h3>{title}</h3>
          <button type="button" className="cv-form-modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="cv-form-modal-body">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>{message}</p>
        </div>
        <div className="cv-form-modal-footer">
          <button type="button" className="btn-cancel-edit" onClick={onCancel}>
            Cancelar
          </button>
          <button 
            type="button" 
            className="cv-btn-solid" 
            style={{ background: isDestructive ? "#D0402F" : "var(--blue)" }} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}