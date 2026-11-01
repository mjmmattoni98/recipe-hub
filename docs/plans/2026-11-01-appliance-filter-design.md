# Filtro por aparato

Diseño aprobado: grupo «Aparato» con Todos, Airfryer y Mambo, integrado en el panel compartido de escritorio y móvil. Selección única, conservada en `?appliance=airfryer` o `?appliance=mambo`, combinable con los demás filtros y eliminable desde las etiquetas activas y el botón de borrar filtros.

Se reutilizan etiquetas, título e instrucciones para reconocer recetas existentes, incluyendo Air Fryer, air-fryer, freidora de aire, freidora sin aceite y Cecofry. No se añaden columnas ni se migran recetas. Una receta que use ambos aparatos puede aparecer en ambas selecciones.

La validación de valores procede de un esquema compartido. El servidor resuelve las coincidencias antes de contar y paginar, usando el mismo conjunto de recetas para ambas operaciones.

Implementación y validación:

1. Añadir el aparato al modelo de filtros, URL, entrada de consulta y contador.
2. Reutilizar los chips existentes y añadir la etiqueta activa eliminable.
3. Integrar el predicado parametrizado de PostgreSQL en el filtrado existente.
4. Probar URL, valores inválidos, combinación con otros filtros, variantes antiguas, límites de palabra y paginación contra PostgreSQL. Ejecutar tipos, lint y build.
