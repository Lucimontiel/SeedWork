"use client";

import { useEffect, useRef, useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import { apiFetch } from "../../lib/api";
import "../estilo-candidato.css";
import { GENERAL_QUESTIONS, ROLE_QUESTIONS, generarFeedback, type Pregunta } from "./questions-data";
import { useLocalSetting } from "@/app/lib/useSettings";

interface FeedbackIA {
  fortalezas: string[];
  areas_de_mejora: string[];
  consejo_final: string;
  puntuacion_general: string;
  texto_transcrito?: string;
}

const ROLES = ["Desarrollador de software", "Diseño UX/UI", "Marketing", "Ventas", "Atención al cliente"];

export default function SimuladorPage() {
  const { candidato } = useCandidato();

  // 🔽 Leemos el toggle de IA desde la configuración
  const [iaActiva] = useLocalSetting("ia:simulador", true);

  const [role, setRole] = useState("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>(GENERAL_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [respuesta, setRespuesta] = useState("");
  const [hasFeedback, setHasFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackIA | null>(null);
  const [statusLine, setStatusLine] = useState("");
  const [completado, setCompletado] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [evaluando, setEvaluando] = useState(false);

  // Audio
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voz para leer la pregunta
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }
  }, []);

  const preguntaActual = preguntas[currentIndex];
  const progresoPct = Math.round((answered / preguntas.length) * 100);

  function cargarPreguntas(nuevoRole: string) {
    setPreguntas(nuevoRole && ROLE_QUESTIONS[nuevoRole] ? ROLE_QUESTIONS[nuevoRole] : GENERAL_QUESTIONS);
    setCurrentIndex(0);
    setAnswered(0);
    setHasFeedback(false);
    setCompletado(false);
    setRespuesta("");
    setStatusLine("");
    setFeedbackData(null);
    limpiarAudio();
  }

  function limpiarAudio() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
  }

  function handleRoleChange(nuevoRole: string) {
    setRole(nuevoRole);
    cargarPreguntas(nuevoRole);
  }

  function handleReset() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (speechSupported) window.speechSynthesis.cancel();
    cargarPreguntas(role);
  }

  // ---------- Grabación de audio con MediaRecorder ----------
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatusLine("Grabando tu respuesta...");
      setRespuesta("");
    } catch {
      setStatusLine("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setStatusLine("Grabación lista. Puedes escucharla o enviarla.");
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function quitarAudio() {
    limpiarAudio();
    setStatusLine("");
  }

  // ---------- Envío y evaluación ----------
  async function handleSubmit() {
    if (hasFeedback) {
      if (currentIndex < preguntas.length - 1) {
        setCurrentIndex((i) => i + 1);
        setHasFeedback(false);
        setRespuesta("");
        setFeedbackData(null);
        setStatusLine("");
        limpiarAudio();
      } else {
        setCompletado(true);
      }
      return;
    }

    const texto = respuesta.trim();
    if (!texto && !audioBlob) {
      setStatusLine("Escribe o graba una respuesta antes de enviarla.");
      return;
    }

    // ---------- MODO SIN IA ----------
    if (!iaActiva) {
      const textoParaEvaluar = texto || "(respuesta por voz)";
      const feedbackSimple = generarFeedback(textoParaEvaluar, preguntaActual);
      setFeedbackData({
        fortalezas: [],
        areas_de_mejora: [],
        consejo_final: feedbackSimple,
        puntuacion_general: "Modo simple",
      });
      setHasFeedback(true);
      setStatusLine("");
      setAnswered((prev) => Math.max(prev, currentIndex + 1));
      return;
    }

    // ---------- MODO CON IA ----------
    setEvaluando(true);
    setStatusLine("Evaluando tu respuesta con IA... Esto puede tomar unos segundos.");

    try {
      const formData = new FormData();
      formData.append("cargo", role || "General");
      formData.append("pregunta", preguntaActual.text);

      if (audioBlob) {
        formData.append("archivo_audio", audioBlob, "respuesta.webm");
      } else {
        formData.append("respuesta_texto", texto);
      }

      // apiFetch ya maneja los errores y devuelve el JSON directamente
      const data = await apiFetch<FeedbackIA>(`/api/simulador/evaluar`, {
        method: "POST",
        body: formData,
      });

      setFeedbackData(data);
      setHasFeedback(true);
      setStatusLine("");
      setAnswered((prev) => Math.max(prev, currentIndex + 1));
    } catch (err: any) {
      setStatusLine(err.message || "Error al conectar con la IA.");
    } finally {
      setEvaluando(false);
    }
  }

  function speakQuestion() {
    if (!speechSupported) {
      setStatusLine("Tu navegador no soporta lectura por voz.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(preguntaActual.text);
    utter.lang = "es-ES";
    utter.rate = 0.98;
    window.speechSynthesis.speak(utter);
  }

  const btnSubmitLabel = evaluando
    ? "Evaluando..."
    : !hasFeedback
    ? "Enviar respuesta"
    : currentIndex < preguntas.length - 1
    ? "Siguiente pregunta →"
    : "Finalizar simulación";

  const nombreCompleto = candidato ? `${candidato.nombres} ${candidato.apellidos}` : "Candidato";

  // Color del badge según la puntuación
  function colorPuntuacion(p: string) {
    const lower = (p || "").toLowerCase();
    if (lower.includes("muy bueno")) return "#1D8A4A";
    if (lower.includes("bueno")) return "#2FA360";
    if (lower.includes("regular")) return "#C97A1F";
    if (lower.includes("modo simple")) return "#64748B";
    return "#D0402F";
  }

  return (
    <CandidatoShell
      nombre={nombreCompleto}
      fotoUrl={candidato?.fotoUrl}
      pageTitle="Simulador de entrevista"
      pageSubtitle="Practica con preguntas reales de la entrevista"
    >
      <div className="content-grid">
        {/* Panel principal */}
        <div className="panel panel-white">
          <p className="field-label">¿A qué cargo te quieres postular?</p>
          <select
            id="roleSelect"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="">Seleccionar</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value="Otro / General">Otro / General</option>
          </select>

          {!completado && (
            <>
              <div className="progress-row">
                <span id="progressLabel">
                  Pregunta {currentIndex + 1} de {preguntas.length}
                </span>
                <div className="dots" id="dots">
                  {preguntas.map((_, i) => (
                    <span
                      key={i}
                      className={`dot ${i < answered ? "filled" : ""}`}
                    />
                  ))}
                </div>
              </div>

              <div className="question-row">
                <h2 id="questionText">{preguntaActual.text}</h2>
                <button
                  className="speak-btn"
                  aria-label="Escuchar pregunta"
                  onClick={speakQuestion}
                  disabled={!speechSupported}
                >
                  <svg viewBox="0 0 20 20"><path d="M3 8v4h3l4 3V5L6 8H3z"/><path d="M13 7a4 4 0 010 6"/><path d="M15.3 5a7 7 0 010 10"/></svg>
                </button>
              </div>

              <div className="answer-wrap">
                <textarea
                  id="answerInput"
                  placeholder={
                    audioBlob
                      ? "Ya grabaste un audio. Envíalo o quítalo para escribir."
                      : "Escribe tu respuesta como si estuvieras en la entrevista..."
                  }
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  disabled={!!audioBlob || evaluando}
                />
                <button
                  className={`mic-btn ${isRecording ? "is-recording" : ""}`}
                  aria-label={isRecording ? "Detener grabación" : "Grabar respuesta"}
                  onClick={toggleRecording}
                  disabled={evaluando || !!audioBlob}
                  title={audioBlob ? "Ya tienes un audio grabado" : isRecording ? "Detener grabación" : "Grabar respuesta"}
                >
                  <svg viewBox="0 0 20 20"><rect x="7" y="2.5" width="6" height="10" rx="3"/><path d="M5 9.5a5 5 0 0010 0"/><path d="M10 14.5V17M7.5 17h5"/></svg>
                </button>
              </div>

              {/* Preview de audio grabado */}
              {audioBlob && audioUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "8px 12px", background: "#F2F4F7", borderRadius: 8 }}>
                  <audio controls src={audioUrl} style={{ flex: 1, height: 32 }} />
                  <button
                    type="button"
                    onClick={quitarAudio}
                    style={{ background: "none", border: "none", color: "#D0402F", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 6px" }}
                    title="Quitar audio"
                    aria-label="Quitar audio"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="status-line" id="statusLine">{statusLine}</div>
            </>
          )}

          {completado && (
            <div className="completion-box" id="completionBox">
              <h3>¡Completaste la simulación! 🎉</h3>
              <p>
                Respondiste las <span id="completionCount">{preguntas.length}</span> preguntas para este cargo.
                Puedes reiniciar para repetir la práctica o elegir otro cargo arriba.
              </p>
            </div>
          )}

          <div className="actions-row">
            {!completado && (
              <button
                className="btn-primary"
                id="btnSubmit"
                onClick={handleSubmit}
                disabled={evaluando}
              >
                {btnSubmitLabel}
              </button>
            )}
            <button className="btn-secondary" id="btnReset" onClick={handleReset} disabled={evaluando}>
              Reiniciar
            </button>
          </div>
        </div>

        {/* Panel lateral — mismo diseño, distinto contenido según estado */}
        <div
          className="panel sim-tip-panel"
          id="tipPanel"
        >
          {hasFeedback && feedbackData ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    margin: 0,
                    color: "#1B4FBA",
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  Feedback de tu respuesta
                </p>
                <span
                  style={{
                    background: colorPuntuacion(feedbackData.puntuacion_general),
                    color: "#fff",
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 11.5,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {feedbackData.puntuacion_general}
                </span>
              </div>

              {feedbackData.texto_transcrito && audioBlob && (
                <p style={{ fontSize: 12, fontStyle: "italic", marginBottom: 12, color: "#35507E" }}>
                  📝 Transcripción: &ldquo;{feedbackData.texto_transcrito}&rdquo;
                </p>
              )}

              {feedbackData.fortalezas?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "#1B4FBA" }}>
                    ✓ Fortalezas
                  </strong>
                  <ul style={{ margin: "0 0 0 18px", padding: 0, fontSize: 13.5, lineHeight: 1.5, color: "#0F2A47" }}>
                    {feedbackData.fortalezas.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {feedbackData.areas_de_mejora?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "#C97A1F" }}>
                    ⚠ Áreas de mejora
                  </strong>
                  <ul style={{ margin: "0 0 0 18px", padding: 0, fontSize: 13.5, lineHeight: 1.5, color: "#0F2A47" }}>
                    {feedbackData.areas_de_mejora.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {feedbackData.consejo_final && (
                <div style={{ paddingTop: 10, borderTop: "1px solid rgba(45, 108, 223, 0.25)" }}>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "#1B4FBA" }}>
                    💡 Consejo
                  </strong>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#0F2A47" }}>
                    {feedbackData.consejo_final}
                  </p>
                </div>
              )}

              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 11.5,
                  color: "#667085",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                {feedbackData.puntuacion_general === "Modo simple"
                  ? "Feedback generado con reglas locales (IA desactivada en Configuración)."
                  : "Feedback generado por IA (Groq + Llama)."}
              </p>
            </>
          ) : (
            <>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "#0F2A47",
                }}
              >
                💡 Consejo para esta pregunta
              </h3>
              <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.6, color: "#0F2A47" }}>
                {completado
                  ? "Has completado la simulación. Reinicia para practicar con otro cargo o vuelve a intentarlo."
                  : preguntaActual.tip}
              </p>
              <div
                style={{
                  paddingTop: 12,
                  borderTop: "1px solid rgba(45, 108, 223, 0.25)",
                }}
              >
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "#35507E" }}>
                  🤖 <strong>Con IA:</strong> al responder, un modelo de lenguaje analizará tu contenido
                  y tu expresión para darte retroalimentación personalizada sobre cómo mejorar
                  tus respuestas en una entrevista real.
                </p>
              </div>
            </>
          )}

          {/* Progreso — integrado al diseño de la tarjeta */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid rgba(45, 108, 223, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1B4FBA",
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                Tu progreso
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A47" }}>
                {progresoPct}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                background: "rgba(45, 108, 223, 0.18)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progresoPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2D6CDF, #1B4FBA)",
                  borderRadius: 6,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: "#35507E",
              }}
            >
              {answered} de {preguntas.length} preguntas respondidas
            </p>
          </div>
        </div>
      </div>
    </CandidatoShell>
  );
}