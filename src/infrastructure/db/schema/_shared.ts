import { timestamp } from 'drizzle-orm/pg-core';

/**
 * Marcas de tiempo estándar.
 *
 * `updated_at` NO se actualiza desde la aplicación: hay un trigger en Postgres
 * (ver sql/0001_security.sql) que lo hace en cada UPDATE. Así el valor es correcto
 * aunque la fila se toque desde un script, desde psql o desde otro servicio.
 */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/** Igual que `timestamps` pero para tablas append-only, donde un UPDATE sería un error. */
export const createdAtOnly = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
};
