#!/usr/bin/env bash
# scripts/vps-setup.sh — Provisioning del backend VPS (Sovereign Station)
# Uso: bash scripts/vps-setup.sh
# Requisitos: Ubuntu 22.04+, acceso sudo

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
fail() { echo -e "${RED}✗${NC} $*"; exit 1; }
info() { echo -e "${CYAN}→${NC} $*"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Carrera LTI — Setup VPS (Sovereign)    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Python >= 3.10 ──────────────────────────────────────────────────────────
info "Verificando Python 3.10+..."

if command -v python3 &>/dev/null; then
  PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
  PY_OK=$(python3 -c "import sys; print(1 if sys.version_info >= (3, 10) else 0)")
  if [ "$PY_OK" = "1" ]; then
    ok "Python $PY_VER detectado."
  else
    warn "Python $PY_VER detectado — se requiere >= 3.10. Instalando..."
    sudo apt-get update -qq
    sudo apt-get install -y python3.11 python3.11-venv python3-pip
    ok "Python 3.11 instalado."
  fi
else
  warn "Python 3 no encontrado. Instalando..."
  sudo apt-get update -qq
  sudo apt-get install -y python3.11 python3.11-venv python3-pip
  ok "Python 3.11 instalado."
fi

# ── 2. FFmpeg ──────────────────────────────────────────────────────────────────
info "Verificando FFmpeg..."

if command -v ffmpeg &>/dev/null; then
  FFMPEG_VER=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
  ok "FFmpeg $FFMPEG_VER detectado."
else
  warn "FFmpeg no encontrado. Instalando..."
  sudo apt-get update -qq
  sudo apt-get install -y ffmpeg
  ok "FFmpeg instalado."
fi

# ── 3. Node.js >= 20 ───────────────────────────────────────────────────────────
info "Verificando Node.js 20+..."

if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
  if [ "$NODE_MAJOR" -ge 20 ]; then
    ok "Node.js $(node --version) detectado."
  else
    warn "Node.js v$(node --version) detectado — se requiere >= 20. Instalando via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ok "Node.js $(node --version) instalado."
  fi
else
  warn "Node.js no encontrado. Instalando via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ok "Node.js $(node --version) instalado."
fi

# ── 4. Entorno virtual Python ──────────────────────────────────────────────────
VENV_DIR="$HOME/.carrera-lti/venv"
info "Verificando entorno virtual Python en $VENV_DIR..."

if [ -f "$VENV_DIR/bin/python" ]; then
  ok "Entorno virtual ya existe."
else
  info "Creando entorno virtual..."
  mkdir -p "$(dirname "$VENV_DIR")"
  python3 -m venv "$VENV_DIR"
  ok "Entorno virtual creado en $VENV_DIR"

  info "Instalando dependencias Python (Docling + Whisper)..."
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet docling openai-whisper sounddevice
  ok "Dependencias Python instaladas."
fi

# ── Resumen ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  VPS listo para Carrera LTI Sovereign    ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo "  Próximos pasos:"
echo "  1. Levantar el servidor FastAPI:  uvicorn server.main:app --host 0.0.0.0 --port 8000"
echo "  2. Verificar conectividad desde T490:  curl http://<tailscale-ip>:8000/health"
echo ""
