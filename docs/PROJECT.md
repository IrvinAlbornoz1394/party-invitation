# Decisiones Arquitectónicas

## Filosofía del Producto

La plataforma NO ofrecerá desarrollo personalizado como modelo principal de negocio.

El producto consiste en una plataforma configurable basada en componentes reutilizables.

La personalización se obtiene mediante la combinación de:

- Plantillas
- Temas
- Variantes de componentes
- Configuración de bloques

No mediante el desarrollo de código específico para cada cliente.

---

## Modelo Comercial

El cliente contrata un plan.

Cada plan incluye un conjunto definido de funcionalidades y componentes disponibles.

El precio del plan contempla únicamente el uso de componentes existentes dentro de la plataforma.

Si un cliente solicita:

- una nueva sección,
- una nueva variante,
- una funcionalidad exclusiva,
- un componente completamente nuevo,

se considerará un desarrollo personalizado y se cotizará por separado.

Posteriormente, el administrador decidirá si dicho desarrollo pasa a formar parte de la biblioteca oficial de componentes.

---

# Biblioteca de Componentes

La plataforma estará basada en una biblioteca interna de componentes reutilizables.

No se crearán componentes específicos para un evento.

El objetivo será ampliar la biblioteca existente en lugar de crear nuevos componentes para cada cliente.

La calidad y reutilización tendrán prioridad sobre la cantidad.

---

# Component Registry

Todos los componentes disponibles deberán registrarse en un registro central.

Ejemplo conceptual:

hero.classic

hero.centered

gallery.carousel

gallery.grid

gallery.masonry

gallery.floating

timeline.vertical

timeline.horizontal

story.classic

story.image-left

story.image-right

footer.classic

footer.centered

El sistema nunca conocerá directamente los componentes.

Únicamente conocerá sus identificadores.

El Component Registry será el encargado de resolver qué componente renderizar.

---

# Renderizado

El Template Renderer nunca deberá contener condiciones específicas como:

if (theme === "Elegance")

if (plan === "Premium")

if (gallery === "Carousel")

En su lugar, deberá consultar el Component Registry para resolver qué componente utilizar.

Esto permitirá agregar nuevas variantes sin modificar el motor de renderizado.

---

# Variantes

Cada componente podrá tener múltiples variantes.

Ejemplo:

Gallery

- Carousel
- Grid
- Masonry
- Floating
- Stack

Todas las variantes deberán implementar la misma interfaz.

El cambio de variante nunca deberá afectar el resto del sistema.

---

# Themes

Los Themes únicamente modificarán la apariencia.

Nunca modificarán la lógica.

Podrán controlar:

- Colores
- Tipografía
- Espaciados
- Sombras
- Bordes
- Animaciones
- Iconografía

Nunca decidirán qué componente renderizar.

---

# Plantillas

Las Plantillas definirán la estructura visual general del evento.

Una plantilla podrá utilizar cualquier Theme.

Las Plantillas nunca duplicarán lógica.

---

# Configuración de Eventos

El administrador será el encargado de crear todos los eventos.

Proceso:

1. Crear evento.
2. Seleccionar plan.
3. Seleccionar plantilla.
4. Seleccionar tema.
5. Configurar las variantes de cada bloque.
6. Activar o desactivar las secciones permitidas por el plan.
7. Publicar.

---

# Configuración por Plan

Cada plan tendrá una configuración base.

Ejemplo:

Plan Esencial

✓ Hero

✓ Historia

✓ Galería

✓ Cronograma

✓ Código de vestimenta

✓ Mesa de regalos

✓ Ubicación

✓ RSVP WhatsApp

Al crear un evento, el sistema cargará automáticamente dicha configuración.

El administrador podrá desactivar cualquier sección incluida.

Nunca podrá activar funcionalidades pertenecientes a un plan superior.

---

# Filosofía del Panel Administrativo

Revisado el 2026-08-27. Antes decía que el cliente final no tendría configurador y que el
autoservicio quedaba fuera del MVP.

La frontera se movió, y no está entre plataforma y cliente: está entre **contenido** y **diseño**.

El cliente captura su contenido:

- nombres, fechas, historia
- fotos
- cronograma
- ubicaciones
- padrinos y textos

La plataforma decide el diseño:

- plantilla
- tema
- variantes de cada bloque
- composición y orden

El motivo del cambio: capturar contenido ajeno a mano desde una conversación de WhatsApp no
escala, y no protege la calidad visual — el contenido nunca fue lo que la ponía en riesgo.

Lo que la decisión anterior buscaba se conserva entero, porque el diseño sigue sin ser del
cliente:

- mantener calidad visual;
- controlar tiempos de entrega;
- evitar complejidad innecesaria.

Todo plan tiene panel, incluido Esencial.

En Esencial ese panel es una sola opción: Contenido.

El menú se arma de plan × rol de la membresía. Ver `docs/ACCESO.md`.

La pantalla de contenido vive en `/panel/eventos/<id>/contenido`.

Formulario a la izquierda, la invitación real a la derecha en un marco de teléfono.

La vista previa no es una aproximación: usa el mismo renderizador y las mismas consultas que sirven
la invitación al invitado. Se actualiza al guardar.

Lo que el cliente captura hoy:

- nombres, fecha y hora, ciudad
- frase de portada e historia
- sedes, cronograma y galería como listas ordenadas
- fotos por enlace, mientras no exista almacenamiento propio
- teléfono, WhatsApp, Instagram y fecha límite para confirmar

Intercambiar variantes y reordenar secciones sigue siendo del plan Plus en adelante.

---

# Componentes

Cada componente deberá cumplir las siguientes reglas:

- Tener una única responsabilidad.
- Ser completamente reutilizable.
- Ser desacoplado.
- Ser fácilmente testeable.
- Ser configurable mediante propiedades.
- No contener datos hardcodeados.
- No depender del origen de datos.

---

# Hooks

Los Hooks existirán únicamente cuando encapsulen lógica reutilizable.

No deberán crearse Hooks únicamente para dividir código.

Cada Hook deberá representar un comportamiento del dominio.

Ejemplos:

useCountdown

useGallery

useMusicPlayer

useRSVP

useTheme

useInvitation

---

# Regla General

Siempre que exista una decisión entre:

- crear un componente nuevo,

o

- extender uno existente,

se deberá priorizar extender la biblioteca existente, siempre que no incremente innecesariamente su complejidad.

La biblioteca crecerá mediante variantes y configuración, no mediante duplicación de componentes.

---

# Principio Rector

Cada mejora implementada deberá beneficiar potencialmente a todos los clientes de la plataforma.

Si una implementación únicamente beneficia a un cliente, deberá evaluarse como una personalización y no como parte del núcleo del sistema.