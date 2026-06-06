import { Product,  WarehouseLocation, Carrier} from '../types/models';

///FILTRAR PRODUCTOS POR ALMACEN ESPECIFICADO
export function filterProductsByWarehouse(products: Product[], warehouse: WarehouseLocation): Product[] {
    return products.filter(products => products.warehouse === warehouse)
}

///funcion buscar por categoria 
export function SearchForCategory( products: Product[], category: string):Product[] {
    return products.filter(products => products.category === category);
}

//Retorna productos donde stockQuantity <= minStockThreshold
export function filterLowStockProducts(products: Product[]): Product[] {
    return products.filter(product => product.stockQuantity <= product.minStockThreshold
)}

//Retorna productos ordenados por cantidad de stock
export function sortProductsByStock(
  products: Product[],
  order: "asc" | "desc"
): Product[] {
  return [...products].sort((a, b) => {
    return order === "asc"
      ? a.stockQuantity - b.stockQuantity
      : b.stockQuantity - a.stockQuantity;
  });
}

//Retorna transportistas ordenados por tasa de entrega a tiempo
export function sortCarriersByReliability(carriers: Carrier[], order: "asc" | "desc"): Carrier[] {
    return [...carriers].sort((a, b) => {
    return order === "asc"
      ? a.onTimeRate - b.onTimeRate
      : b.onTimeRate - a.onTimeRate;
});
}
/*
//buscar por precio
export function SearchForPrice (item: InventaryItem[], price: number): InventaryItem[]{
    return item.filter(item => item.price === price);
}*/
/*
//buscar por estado
export function SearchForStatus(item: InventaryItem[], status: boolean): InventaryItem[]{
    return item.filter(item => item.status === status)
}*/
/*
//ordenar por nombre asc o desc
export function OrderByName (product: Product[], order: 'asc' | 'desc'): Product[]{
    return [...product].sort((a, b) => { 
        return order === 'asc'
        ? a.nameProduct.localeCompare(b.nameProduct) : b.nameProduct.localeCompare(a.nameProduct);
    });
}*/

