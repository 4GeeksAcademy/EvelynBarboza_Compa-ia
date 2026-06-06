import { Product, Shipment } from "../types/models";

//BUSQUEDA LINEAL POR SKU PRODUCTO
export function findProductBySKU(products: Product[], sku: string): Product | null {
    return products.find(products => products.sku === sku)?? null;
}
///BUSQUEDA LINEAL POR ENVÍO
export function findShipmentById(shipments: Shipment[], id: string): Shipment | null {
    return shipments.find(shipments => shipments.id === id ) ?? null;
}

//BUSQUEDA BINARIA DEL INDICE DEL PRODUCTO CON PESO OBJETIVO
export function binarySearchProductByWeight(
  sortedProducts: Product[],
  targetWeight: number
): number {

    let left = 0;
    let rigth = sortedProducts.length - 1;

    while (left <= rigth) {

        const middle = Math.floor((left + rigth) / 2);

        if (sortedProducts[middle].weightKg === targetWeight) {
            return middle;
        }

        if (sortedProducts[middle].weightKg < targetWeight) {
            left = middle + 1;
        } else {
            rigth = middle - 1;
        }
    }

    return -1;
}
