"use client";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24, paddingBottom: 24 }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-outline-sm"
        style={{ padding: "8px 12px" }}
      >
        ← Anterior
      </button>
      
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
        Página {currentPage} de {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-outline-sm"
        style={{ padding: "8px 12px" }}
      >
        Siguiente →
      </button>
    </div>
  );
}