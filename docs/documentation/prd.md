# **PRD: Carrera LTI**

**Estado:** Alpha (v1.0 - Sync Ready)

**Dueño del Producto:** Juan Antonio

**Líder Técnico:** Antigravity (IA Partner)

**Fecha de última actualización:** 2026-03-11

**App ID / Identificador de Proyecto:** carrera-lti-utec-2024

## **1. Resumen Ejecutivo**

Carrera LTI es una "súper-app" académica y de productividad diseñada específicamente para los estudiantes de la Licenciatura en Tecnologías de la Información de la UTEC Uruguay (Plan 2024).

* **Visión del Producto:** Convertirse en el sistema operativo académico definitivo para el estudiante de la LTI, centralizando herramientas de estudio, gestión de notas y organización personal en un entorno local y privado.
* **Propuesta de Valor:** Integración nativa de la malla curricular oficial con un sistema de "Segundo Cerebro" (Aether) y un espacio de trabajo inteligente (Nexus) potenciado por IA RAG.
* **Público Objetivo:** Estudiantes de la LTI (UTEC Uruguay), Plan 2024.
* **Contexto de Mercado:** Reemplaza el uso fragmentado de Notion, Obsidian y Excel por una solución unificada que ya conoce los datos del plan de estudios y funciona offline.

## **2. Definición y Análisis del Problema**

* **Estado Actual:** Los estudiantes deben cargar manualmente sus materias en herramientas genéricas, gestionar sus notas en hojas de cálculo separadas y alternar entre múltiples apps para tomar apuntes y organizar tareas.
* **Impacto de No Resolverlo:** Fragmentación de la información, pérdida de tiempo en configuración manual de planes de estudio y falta de una visión integrada del progreso en la carrera.
* **Análisis de Causas Raíz:** Las herramientas actuales son genéricas; no hay una aplicación de nicho que entienda la estructura específica de créditos, semestres y jornadas presenciales de la UTEC LTI.

## **3. Objetivos Estratégicos y KPIs**

| Objetivo | Métrica de Éxito (KPI) | Línea Base (Hoy) | Meta (Paso Final) |
| :---- | :---- | :---- | :---- |
| **Centralización** | % de materias gestionadas en la App | 0% | 100% (Carrera Completa) |
| **Retención de Conocimiento** | Número de notas bidireccionales en Aether | 0 | >100 notas por semestre |
| **Eficiencia de Estudio** | Tiempo para encontrar una U.C. y sus datos | >60s (manual) | <2s (Ctrl+K) |

## **4. User Personas**

* **[El Estudiante Organizado]:** Desea tener el control total de sus créditos, notas y cronograma de exámenes. Valora el modo oscuro premium y la velocidad de respuesta.
* **[El Investigador de IA]:** Utiliza Nexus AI para cruzar información entre sus apuntes y la documentación oficial de la carrera.

## **5. Requisitos Funcionales**

### **P0: Críticos (Base) - [IMPLEMENTADO]**
* **RF.01:** Visualización interactiva de la Malla Curricular (8 semestres).
* **RF.02:** Dashboard de progreso con contador de créditos (Aprobados/En Curso/Pendientes).
* **RF.03:** Kanban de tareas avanzado con estados y prioridades.
* **RF.04:** Gestión de Notas (Bóveda Aether) con soporte Markdown y WikiLinks.
* **RF.08:** (Nuevo) **Sincronización Universal en la Nube** vía Firebase para todos los módulos.

### **P1: Importantes (IA & UX) - [EN DESARROLLO / PARCIAL]**
* **RF.05:** Nexus AI: Chat con RAG nativo sobre documentos y notas del usuario. [IMPLEMENTADO]
*   **RF.09:** Calendario Académico 2026 integrado con vistas anual, mensual y semanal. [IMPLEMENTADO]
*   **RF.10:** (Nuevo) **Monitor de Gmail Flotante** global para seguimiento de correos académicos. [IMPLEMENTADO]
*   **RF.06:** Grafo de Conocimiento 2D para visualización de notas relacionadas.
* **RF.07:** Timer Pomodoro flotante global.

## **6. Requisitos No Funcionales**

* **Offline-First:** Funcionamiento completo sin conexión mediante IndexedDB y Service Workers.
* **Privacidad:** Cifrado AES-256-GCM local para datos sensibles.
* **Performance:** Navegación instantánea mediante Single Page Application (React + Vite).

## **7. Experiencia de Usuario (UX)**

* **Diseño:** Estética Premium "Dark Mode" con acentos en azul LTI.
* **Interacción:** Paleta de comandos (Ctrl+K) para navegación rápida.
* **Arquitectura:** Sidebar lateral con acceso rápido a los 13 módulos principales.
