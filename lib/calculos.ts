import type {
  PresupuestoLinea,
  RecetaConInsumos,
} from "../types";

function aplicarPorcentaje(base: number, porcentaje: number): number {
  return base * (porcentaje / 100);
}

/**
 * Calcula el precio unitario total de una receta a partir de sus ingredientes.
 *
 * @param ingredientes Array de relaciones receta-insumo con el objeto insumo cargado.
 * @returns La suma de cantidad por precio de cada ingrediente.
 */
export function calcularPrecioReceta(
  ingredientes: RecetaConInsumos["ingredientes"],
): number {
  return ingredientes.reduce((total, ingrediente) => {
    return total + ingrediente.cantidad * ingrediente.insumo.precio_unitario;
  }, 0);
}

/**
 * Calcula la cantidad de una medicion: número de partes × largo × ancho × alto.
 *
 * Replica EXACTAMENTE la columna generada `cantidad_calculada` de PostgreSQL:
 * las dimensiones faltantes se reemplazan por 1 (COALESCE), nunca por 0.
 * La base de datos es la fuente de verdad; este helper sirve para previsualizar
 * el parcial en el front antes de guardar.
 *
 * @param n Número de partes iguales (por defecto 1).
 * @param largo Largo opcional; si falta se toma como 1.
 * @param ancho Ancho opcional; si falta se toma como 1.
 * @param alto Alto opcional; si falta se toma como 1.
 * @returns El producto de los cuatro factores.
 */
export function calcularCantidadMedicion(
  n: number = 1,
  largo?: number,
  ancho?: number,
  alto?: number,
): number {
  const factor = (v?: number) => (typeof v === "number" ? v : 1);
  return factor(n) * factor(largo) * factor(ancho) * factor(alto);
}

/**
 * Calcula el subtotal de una linea de presupuesto.
 *
 * @param cantidad Cantidad total medida.
 * @param precioUnitario Precio unitario aplicado a la cantidad.
 * @returns El resultado de multiplicar cantidad por precio unitario.
 */
export function calcularSubtotalLinea(
  cantidad: number,
  precioUnitario: number,
): number {
  return cantidad * precioUnitario;
}

/**
 * Calcula los totales generales del presupuesto a partir de sus lineas y porcentajes.
 *
 * @param lineas Lineas del presupuesto ya calculadas.
 * @param porcentajeGastosGenerales Porcentaje de gastos generales, por ejemplo 10 para 10%.
 * @param porcentajeBeneficio Porcentaje de beneficio aplicado sobre subtotal mas gastos generales.
 * @param porcentajeImpuestos Porcentaje de impuestos aplicado sobre subtotal, gastos generales y beneficio.
 * @returns Un objeto con subtotal, gastos_generales, beneficio, impuestos y total final.
 */
export function calcularTotalesPresupuesto(
  lineas: PresupuestoLinea[],
  porcentajeGastosGenerales: number,
  porcentajeBeneficio: number,
  porcentajeImpuestos: number,
) {
  const subtotal = lineas.reduce((total, linea) => total + linea.subtotal, 0);
  const gastos_generales = aplicarPorcentaje(subtotal, porcentajeGastosGenerales);
  const baseBeneficio = subtotal + gastos_generales;
  const beneficio = aplicarPorcentaje(baseBeneficio, porcentajeBeneficio);
  const baseImpuestos = baseBeneficio + beneficio;
  const impuestos = aplicarPorcentaje(baseImpuestos, porcentajeImpuestos);
  const total = subtotal + gastos_generales + beneficio + impuestos;

  return {
    subtotal,
    gastos_generales,
    beneficio,
    impuestos,
    total,
  };
}
