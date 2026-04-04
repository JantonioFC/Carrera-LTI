; build/prereqs.nsh — Verificación de prerequisitos antes de instalar Carrera LTI
; Incluido via nsis.include en package.json.
; Se ejecuta al inicio del instalador gracias al macro customInit.

!macro customInit
  ; ── Python >= 3.10 ────────────────────────────────────────────────────────
  ; Usamos python -c para obtener un "1" si la versión es aceptable, "0" si no.
  ; Esto evita tener que parsear strings como "Python 3.11.2" en NSIS.
  nsExec::ExecToStack 'python -c "import sys; print(1 if sys.version_info >= (3, 10) else 0)"'
  Pop $0  ; exit code del proceso
  Pop $1  ; stdout ("1" o "0")

  ${If} $0 != 0
    ; python no está en el PATH
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "Python no encontrado en el sistema.$\n$\nCarrera LTI requiere Python 3.10 o superior.$\nDescárgalo desde: https://python.org$\n$\nAsegurate de marcar 'Add Python to PATH' durante la instalación."
    Abort
  ${EndIf}

  ${If} $1 != "1"
    ; python existe pero la versión es < 3.10
    nsExec::ExecToStack 'python --version'
    Pop $0
    Pop $2  ; "Python X.Y.Z"
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "$2 detectado. Carrera LTI requiere Python 3.10 o superior.$\nDescárgalo desde: https://python.org"
    Abort
  ${EndIf}

  ; ── FFmpeg ────────────────────────────────────────────────────────────────
  nsExec::ExecToStack 'ffmpeg -version'
  Pop $0
  Pop $1

  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "FFmpeg no encontrado en el sistema.$\n$\nCarrera LTI requiere FFmpeg para procesar audio (Whisper).$\nDescárgalo desde: https://ffmpeg.org/download.html$\n$\nAsegurate de agregarlo al PATH del sistema."
    Abort
  ${EndIf}
!macroend
