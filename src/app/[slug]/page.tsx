import { redirect } from 'next/navigation';

/**
 * `/<slug>` sin código.
 *
 * Existe únicamente para que probar `/fatima` a secas mande a la landing en lugar de
 * dar un 404. Un 404 confirmaría que el slug no existe, y por contraste, una respuesta
 * distinta para `/kamilah-3-anios` revelaría que ese sí existe. Redirigiendo siempre,
 * ambos casos son indistinguibles.
 *
 * No se consulta la base de datos a propósito: sin código no hay nada que validar, y
 * no tocar Postgres aquí evita que esta ruta sirva para hacer sondeos.
 */
export default function SlugWithoutCode() {
  redirect('/');
}
