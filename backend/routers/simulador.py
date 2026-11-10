from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from groq import Groq
import os, json
from database import get_db
from dependencies import get_current_user
from models import Usuario
from rate_limit import limiter

router = APIRouter(prefix="/api/simulador", tags=["Simulador IA"])
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PROMPT_EVALUACION = """
Eres un reclutador experto y coach de entrevistas. Evalúa la respuesta de un candidato para el puesto de **{cargo}**.
Pregunta: {pregunta}
Respuesta: {respuesta}
Instrucciones: Analiza contenido (STAR), expresión, y da un consejo. Responde en JSON: {{"fortalezas": [], "areas_de_mejora": [], "consejo_final": "", "puntuacion_general": ""}}
"""

@router.post("/evaluar")
@limiter.limit("10/hour")
async def evaluar_respuesta_simulador(request: Request, cargo: str = Form(...), pregunta: str = Form(...), respuesta_texto: str = Form(None), archivo_audio: UploadFile = File(None), usuario: Usuario = Depends(get_current_user)):
    if not respuesta_texto and not archivo_audio: raise HTTPException(400, "Falta texto o audio.")
    texto_final = respuesta_texto
    if archivo_audio:
        try:
            contenido = await archivo_audio.read()
            if len(contenido) > 10 * 1024 * 1024: raise HTTPException(413, "Audio > 10MB")
            transcripcion = groq_client.audio.transcriptions.create(model="whisper-large-v3-turbo", file=(archivo_audio.filename, contenido), language="es", response_format="text")
            texto_final = transcripcion
        except Exception as e: raise HTTPException(500, f"Error audio: {str(e)}")
    try:
        respuesta_llm = groq_client.chat.completions.create(model="openai/gpt-oss-120b", messages=[{"role": "system", "content": "Responde en JSON."}, {"role": "user", "content": PROMPT_EVALUACION.format(cargo=cargo, pregunta=pregunta, respuesta=texto_final)}], response_format={"type": "json_object"}, temperature=0.5)
        resultado = json.loads(respuesta_llm.choices[0].message.content)
        resultado["texto_transcrito"] = texto_final
        return resultado
    except Exception as e: raise HTTPException(500, f"Error IA: {str(e)}")