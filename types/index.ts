export interface Insumo {
  id: string;
  codigo?: string;
  nombre: string;
  unidad_medida: string;
  tipo: "material" | "mano_de_obra" | "equipo";
  precio_unitario: number;
  created_at: string;
  updated_at: string;
}

export interface Receta {
  id: string;
  nombre: string;
  unidad_medida: string;
  created_at: string;
  updated_at: string;
}

export interface RecetaInsumo {
  id: string;
  receta_id: string;
  insumo_id: string;
  cantidad: number;
  created_at: string;
}

export interface Obra {
  id: string;
  nombre: string;
  cliente: string;
  direccion?: string;
  fecha_inicio?: string;
  estado: "activa" | "pausada" | "finalizada";
  created_at: string;
  updated_at: string;
}

export interface Rubro {
  id: string;
  obra_id: string;
  nombre: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  rubro_id: string;
  receta_id: string;
  descripcion: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Medicion {
  id: string;
  item_id: string;
  descripcion: string;
  n: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  cantidad_calculada: number;
  created_at: string;
  updated_at: string;
}

export interface RecetaConInsumos extends Receta {
  ingredientes: Array<
    RecetaInsumo & {
      insumo: Insumo;
    }
  >;
  precio_unitario: number;
}

export interface ItemConReceta extends Item {
  receta: Receta;
}

export interface ItemCompleto extends Item {
  receta: RecetaConInsumos;
  mediciones: Medicion[];
  cantidad_total: number;
}

export interface RubroCompleto extends Rubro {
  items: ItemCompleto[];
  subtotal: number;
}

export interface PresupuestoLinea {
  rubro_id: string;
  rubro_nombre: string;
  item_id: string;
  receta_id: string;
  receta_nombre: string;
  unidad: string;
  cantidad_total: number;
  precio_unitario: number;
  subtotal: number;
}