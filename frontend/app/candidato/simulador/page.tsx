"use client";

import { useEffect, useRef, useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import { GENERAL_QUESTIONS, ROLE_QUESTIONS, generarFeedback, type Pregunta } from "./questions-data";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const ROLES = ["Desarrollador de software", "Diseño UX/UI", "Marketing", "Ventas", "Atención al cliente"];

export default function SimuladorPage() {
  const { candidato } = useCandidato();

  const [role, setRole] = useState("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>(GENERAL_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [respuesta, setRespuesta] = useState("");
  const [hasFeedback, setHasFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [statusLine, setStatusLine] = useState("");
  const [completado, setCompletado] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  useEffect(() => {
    const Impl = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Impl) return;

    const recognition = new Impl();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) baseTextRef.current = (baseTextRef.current ? baseTextRef.current + " " : "") + final.trim();
      setRespuesta((baseTextRef.current + " " + interim).trim());
    };

    recognition.onerror = () => {
      setStatusLine("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setStatusLine((prev) => (prev === "Grabando tu respuesta..." ? "Grabación detenida." : prev));
    };

    recognitionRef.current = recognition;
    setRecognitionSupported(true);
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
    setFeedback("");
  }

  function handleRoleChange(nuevoRole: string) {
    setRole(nuevoRole);
    cargarPreguntas(nuevoRole);
  }

  function handleReset() {
    if (recognitionRef.current && isRecording) recognitionRef.current.stop();
    if (speechSupported) window.speechSynthesis.cancel();
    cargarPreguntas(role);
  }

  function handleSubmit() {
    if (hasFeedback) {
      if (currentIndex < preguntas.length - 1) {
        setCurrentIndex((i) => i + 1);
        setHasFeedback(false);
        setRespuesta("");
        setFeedback("");
        setStatusLine("");
      } else {
        setCompletado(true);
      }
      return;
    }

    const texto = respuesta.trim();
    if (!texto) {
      setStatusLine("Escribe o graba una respuesta antes de enviarla.");
      return;
    }

    setFeedback(generarFeedback(texto, preguntaActual));
    setStatusLine("");
    setAnswered((prev) => Math.max(prev, currentIndex + 1));
    setHasFeedback(true);
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

  function toggleRecording() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    baseTextRef.current = respuesta.trim();
    try {
      recognition.start();
      setIsRecording(true);
      setStatusLine("Grabando tu respuesta...");
    } catch {
      setStatusLine("No se pudo iniciar la grabación.");
    }
  }

  const btnSubmitLabel = !hasFeedback
    ? "Enviar respuesta"
    : currentIndex < preguntas.length - 1
    ? "Siguiente pregunta →"
    : "Finalizar simulación";

  return (
    <CandidatoShell
      nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : undefined}
      pageTitle="Simulador de entrevista"
      pageSubtitle="Practica con preguntas reales de la entrevista"
    >
      <div className="content-grid">
        <div className="panel panel-white">
          <p className="field-label">¿A qué cargo te quieres postular?</p>
          <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
            <option value="">Seleccionar</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {!completado && (
            <>
              <div className="progress-row">
                <span>Pregunta {currentIndex + 1} de {preguntas.length}</span>
                <div className="dots">
                  {preguntas.map((_, i) => (
                    <span key={i} className={"dot" + (i < answered ? " filled" : "")} />
                  ))}
                </div>
              </div>

              <div className="question-row">
                <h2>{preguntaActual.text}</h2>
                <button className="speak-btn" aria-label="Escuchar pregunta" onClick={speakQuestion} disabled={!speechSupported}>
                  <svg viewBox="0 0 20 20"><path d="M3 8v4h3l4 3V5L6 8H3z" /><path d="M13 7a4 4 0 010 6" /><path d="M15.3 5a7 7 0 010 10" /></svg>
                </button>
              </div>

              <div className="answer-wrap">
                <textarea
                  placeholder="Escribe tu respuesta como si estuvieras en la entrevista..."
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                />
                <button
                  className={"mic-btn" + (isRecording ? " is-recording" : "")}
                  aria-label="Grabar respuesta"
                  onClick={toggleRecording}
                  disabled={!recognitionSupported}
                  title={!recognitionSupported ? "Tu navegador no soporta reconocimiento de voz (usa Chrome o Edge)" : undefined}
                >
                  <svg viewBox="0 0 20 20"><rect x="7" y="2.5" width="6" height="10" rx="3" /><path d="M5 9.5a5 5 0 0010 0" /><path d="M10 14.5V17M7.5 17h5" /></svg>
                </button>
              </div>
              <div className="status-line">{statusLine}</div>

              {hasFeedback && (
                <div className="feedback-box">
                  <p className="label">Feedback de tu respuesta</p>
                  <p>{feedback}</p>
                  <p className="feedback-disclaimer">
                    Este feedback se genera con reglas automáticas simples a partir de tu respuesta, no es un análisis de IA real.
                  </p>
                </div>
              )}
            </>
          )}

          {completado && (
            <div className="completion-box">
              <h3>¡Completaste la simulación! 🎉</h3>
              <p>Respondiste las <span>{preguntas.length}</span> preguntas para este cargo. Puedes reiniciar para repetir la práctica o elegir otro cargo arriba.</p>
            </div>
          )}

          <div className="actions-row">
            {!completado && <button className="btn-primary" onClick={handleSubmit}>{btnSubmitLabel}</button>}
            <button className="btn-secondary" onClick={handleReset}>Reiniciar</button>
          </div>
        </div>

        <div className="panel panel-blue">
          <h3>Consejo para esta pregunta</h3>
          <p>{completado ? "" : preguntaActual.tip}</p>
          <hr className="panel-divider" />
          <h3>Tu progreso</h3>
          <p>{progresoPct}% completado</p>
        </div>
      </div>
    </CandidatoShell>
  );
}