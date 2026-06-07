import { Product, Shipment } from "./types/models";

import {
  countProductsByCategory,
  calculateTotalInventoryValue,
  calculateStockByWarehouse,
  calculateAverageShipmentDistance,
} from "./utils/transformations";

const products: Product[] = [
  {
    sku: "SKU-001",
    nameProduct: "Laptop",
    stock: 10,
    category: "Electronics",
    weightKg: 2,
    dimensions: {
      lengthCm: 30,
      widthCm: 20,
      heightCm: 5
    },
    warehouse: "Los Angeles",
    stockQuantity: 10,
    minStockThreshold: 3,
    unitCostUSD: 1200,
    isFragile: true,
    status: "Active"
  },

  {
    sku: "SKU-002",
    nameProduct: "Silla",
    stock: 20,
    category: "Home",
    weightKg: 8,
    dimensions: {
      lengthCm: 50,
      widthCm: 50,
      heightCm: 100
    },
    warehouse: "Zaragoza",
    stockQuantity: 2,
    minStockThreshold: 5,
    unitCostUSD: 80,
    isFragile: false,
    status: "Low stock"
  },

  {
    sku: "SKU-003",
    nameProduct: "Perfume",
    stock: 30,
    category: "Cosmetics",
    weightKg: 1,
    dimensions: {
      lengthCm: 10,
      widthCm: 10,
      heightCm: 20
    },
    warehouse: "Los Angeles",
    stockQuantity: 25,
    minStockThreshold: 5,
    unitCostUSD: 50,
    isFragile: true,
    status: "Active"
  }
];

const shipments: Shipment[] = [
  {
    id: "SH-001",
    sku: "SKU-001",
    quantity: 2,
    origin: "Los Angeles",
    destination: {
      city: "Miami",
      country: "United States",
      postalCode: "33101",
      distanceKm: 4300
    },
    priority: "Express",
    declaredValueUSD: 2400,
    carrier: "CAR-UPS",
    status: "In transit",
    createdAt: new Date()
  },

  {
    id: "SH-002",
    sku: "SKU-002",
    quantity: 1,
    origin: "Zaragoza",
    destination: {
      city: "Madrid",
      country: "Spain",
      postalCode: "28001",
      distanceKm: 320
    },
    priority: "Standard",
    declaredValueUSD: 80,
    carrier: "CAR-DHL",
    status: "Delivered",
    createdAt: new Date()
  }
];

console.log("PRODUCTOS POR CATEGORIA");
console.log(
  countProductsByCategory(products)
);

console.log("\nVALOR TOTAL INVENTARIO");
console.log(
  calculateTotalInventoryValue(products)
);

console.log("\nSTOCK POR ALMACEN");
console.log(
  calculateStockByWarehouse(products)
);


console.log("\nDISTANCIA PROMEDIO");
console.log(
  calculateAverageShipmentDistance(
    shipments
  )
);
