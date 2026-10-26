"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "settings:candidato:";
const EVENT_NAME = "sw:setting-change"; // ⬅️ Nombre del evento global

function leer<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function escribir<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  
  // ⬇️ AVISAMOS A TODOS LOS COMPONENTES DEL CAMBIO
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key, value } }));
}

export function useLocalSetting<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    setValue(leer(key, defaultValue));
  }, [key]);

  // ⬇️ ESCUCHAMOS EL EVENTO GLOBAL PARA SINCRONIZAR
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === key) {
        setValue(customEvent.detail.value);
      }
    };
    window.addEventListener(EVENT_NAME, handleEvent);
    return () => window.removeEventListener(EVENT_NAME, handleEvent);
  }, [key]);

  const update = useCallback(
    (nuevo: T) => {
      setValue(nuevo);
      escribir(key, nuevo);
    },
    [key]
  );

  return [value, update] as const;
}