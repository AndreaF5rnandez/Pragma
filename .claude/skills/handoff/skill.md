---
name: handoff
description: >
  Usá esta skill cada vez que el usuario pida un handoff, cierre de sesión,
  o guardar el progreso. Crea un archivo de handoff en la carpeta /handoff
  siguiendo la estructura definida. Nunca sobreescribas un handoff anterior,
  siempre creá uno nuevo.
---

# Handoff — Skill de traspaso de sesión

## Cuándo se usa
Cada vez que el usuario diga "handoff", "guardá el progreso", "cerramos sesión",
"guardá los cambios antes de cerrar", o cualquier variante.

## Qué hacer

1. Crear un archivo nuevo en la carpeta `/handoff` en la raíz del proyecto.
2. El nombre del archivo sigue este formato: `YYYY-MM-DD_titulo-corto.md`
   - La fecha es la del día actual
   - El título es un resumen de 2-4 palabras de lo que se hizo (ej: `gantt-drag-drop`, `fix-costos-recibos`, `dashboard-semanal`)
3. Si ya existe un handoff con la misma fecha, agregar un sufijo numérico: `2026-06-16_gantt-visual_2.md`

## Estructura del handoff

Cada archivo sigue esta estructura exacta:

# Handoff — [Título descriptivo]
**Fecha:** YYYY-MM-DD
**Sesión:** [número si se sabe, o "continuación"]

## Contexto
[1-2 líneas de qué se estaba haciendo en esta sesión]

## Lo que se hizo
- [Lista concreta de cambios, archivos creados/modificados]
- [Ser específico: "Creé componente X en /app/components/X.tsx"]
- [Incluir nombres de archivos reales]

## Lo que quedó pendiente
- [Tareas que no se completaron]
- [Bugs conocidos que quedaron]

## Decisiones tomadas
- [Decisiones de diseño o arquitectura que se tomaron en esta sesión]
- [Por qué se eligió hacer algo de una forma y no de otra]

## Próximos pasos sugeridos
- [Qué debería hacer la próxima sesión]
- [En qué orden]

## Archivos clave tocados
- [Lista de archivos creados o modificados]

## Reglas importantes
- NUNCA sobreescribir un handoff anterior
- NUNCA agregar contenido a un handoff existente
- Cada handoff es un archivo independiente y corto (máximo 60 líneas)
- No incluir código en el handoff, solo descripciones y rutas de archivos
- El handoff debe ser útil para alguien que NO estuvo en la sesión
