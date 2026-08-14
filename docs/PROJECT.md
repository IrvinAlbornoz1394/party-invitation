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

Durante el MVP, el administrador será quien configure completamente cada invitación.

El cliente final no tendrá acceso a un configurador.

Esto permite:

- mantener calidad visual;
- controlar tiempos de entrega;
- evitar complejidad innecesaria;
- validar el negocio antes de automatizar procesos.

El autoservicio no forma parte del MVP.

Podrá evaluarse en el futuro únicamente si aporta valor real al negocio.

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