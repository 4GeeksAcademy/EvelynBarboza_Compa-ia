import { InventaryItem } from "../types/models";

//Buscar Lineal 
export function SearchLinealSku(items: InventaryItem[], sku: string): InventaryItem | undefined {
    return items.find(items => items.sku === sku);
}

//Busqueda Binaria
export function SearchBinarySku(items: InventaryItem[], sku: string): InventaryItem | number {
    
    let left = 0;
    let rigth = items.length -1;

        while(left<= rigth){

            let middle =(Math.floor(rigth +left)/2);

            if (items[middle].sku === sku){
                return items[middle]
            }
git 
            if (items[middle].sku < sku ){
                left = middle +1;
            } else {
                rigth = middle -1;
            }
        }
        return -1
}