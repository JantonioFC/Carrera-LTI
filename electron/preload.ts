import { contextBridge } from "electron";

/**
 * API expuesta al Renderer Process.
 * Fase A: objeto vacío tipado — se extiende en Fases B-E.
 * El Renderer detecta su presencia para saber si corre en Electron.
 */
contextBridge.exposeInMainWorld("cortexAPI", {});
