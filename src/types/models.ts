//almacenes
export interface Warehouse {
    id: number;
    name: string;
    country: string;
}

//inventario
export interface InventaryItem {
    sku: string; //especie de id del producto
    nameProduct: string;
    stock: number;
    price: number;
    category: string;
    status: boolean; //disponible = true o noDisponible = false
    warehouseId: number;
}

//transportistas
export interface Carrier {
    id: number;
    nameCarr: string;
    country: string;
    active: boolean;
}

//envío
export interface Shipment {
    id: number; 
    destination: string;
    carrierId: number;
    weight: number; //altura
    delivered: boolean; //si fue enviado o no 
}

//devoluciones
export interface Devolution{
    id: number;
    sku: string;
    motive: string;
    approved: boolean;
}

