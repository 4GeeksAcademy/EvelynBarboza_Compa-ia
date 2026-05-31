import { InventaryItem } from '../types/models';

///funcion buscar por categoria 
export function SearchForCategory( products: InventaryItem[], category: string): InventaryItem[] {
    return products.filter(products => products.category === category);
}

//buscar por precio
export function SearchForPrice (item: InventaryItem[], price: number): InventaryItem[]{
    return item.filter(item => item.price === price);
}

//buscar por estado
export function SearchForStatus(item: InventaryItem[], status: boolean): InventaryItem[]{
    return item.filter(item => item.status === status)
}

//ordenar por nombre asc o desc
export function OrderByName (product: InventaryItem[], order: 'asc' | 'desc'): InventaryItem[]{
    return [...product].sort((a, b) => { 
        return order === 'asc'
        ? a.nameProduct.localeCompare(b.nameProduct) : b.nameProduct.localeCompare(a.nameProduct);
    });
}

