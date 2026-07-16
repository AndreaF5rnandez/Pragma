import { calcularCierrePresupuesto } from "./calculos";
import type { CierrePresupuesto, GastoModalidad, PaqueteEmpresario } from "../types";

export type GastoGeneralParaCalculo = {
  monto: number;
  modalidad: GastoModalidad;
  meses: number | null;
};

export type PaqueteParaCalculo = Pick<
  PaqueteEmpresario,
  "costo_financiero" | "beneficio" | "iva" | "rentas"
>;

/**
 * Réplica en cliente de la cascada que arma /api/presupuesto/[obraId]
 * (lib/calculos.ts), para optimistic updates: mismo resultado, sin red.
 *
 * El total por gasto es exactamente el de `calcularTotalGasto` en
 * lib/calculos.ts (mensual = monto × meses, único = monto); el cierre en
 * cascada delega directamente en `calcularCierrePresupuesto` para garantizar
 * resultado idéntico al del servidor.
 */
export function calcularResumenLocal(
  costoCosto: number,
  gastosGenerales: GastoGeneralParaCalculo[],
  paquete: PaqueteParaCalculo,
): CierrePresupuesto {
  const totalGastosGenerales = gastosGenerales.reduce((suma, gasto) => {
    const total = gasto.modalidad === "mensual" ? gasto.monto * (gasto.meses ?? 0) : gasto.monto;
    return suma + total;
  }, 0);

  return calcularCierrePresupuesto(costoCosto, totalGastosGenerales, paquete);
}

export default calcularResumenLocal;
