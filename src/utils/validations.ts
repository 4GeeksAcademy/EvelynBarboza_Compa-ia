import { Carrier, Product, Shipment, ValidationResult } from "../types/models";

////////////////// VALIDAR PRODUCTO //////////////////
export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];

  if (!product) {
    return {
      valid: false,
      errors: ["Product is required."]
    };
  }

  if (!product.sku.trim()) {
    errors.push("SKU is required.");
  }

  if (!product.nameProduct.trim()) {
    errors.push("Product name is required.");
  }

  if (product.weightKg <= 0) {
    errors.push("Weight must be greater than 0.");
  }

  if (product.stockQuantity < 0) {
    errors.push("Stock quantity cannot be negative.");
  }

  if (product.minStockThreshold < 0) {
    errors.push("Minimum stock threshold cannot be negative.");
  }

  if (product.unitCostUSD < 0) {
    errors.push("Unit cost cannot be negative.");
  }

  if (product.dimensions.lengthCm <= 0) {
    errors.push("Length must be greater than 0.");
  }

  if (product.dimensions.widthCm <= 0) {
    errors.push("Width must be greater than 0.");
  }

  if (product.dimensions.heightCm <= 0) {
    errors.push("Height must be greater than 0.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
////////////////// VALIDAR ENVÍO //////////////////
export function validateShipment(shipment: Shipment): ValidationResult {
  const errors: string[] = [];

  if (!shipment) {
    return {
      valid: false,
      errors: ["Shipment is required."]
    };
  }

  if (!shipment.id.trim()) {
    errors.push("Shipment id is required.");
  }

  if (!shipment.sku.trim()) {
    errors.push("Shipment SKU is required.");
  }

  if (shipment.quantity <= 0) {
    errors.push("Quantity must be greater than 0.");
  }

  if (shipment.declaredValueUSD < 0) {
    errors.push("Declared value cannot be negative.");
  }

  if (shipment.destination.distanceKm <= 0) {
    errors.push("Distance must be greater than 0.");
  }

  if (!shipment.destination.city.trim()) {
    errors.push("Destination city is required.");
  }

  if (!shipment.destination.postalCode.trim()) {
    errors.push("Postal code is required.");
  }

  if (!(shipment.createdAt instanceof Date)) {
    errors.push("Created date must be a valid Date.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

////////////////// VALIDAR TRANSPORTISTA //////////////////
export function validateCarrier(carrier: Carrier): ValidationResult {
  const errors: string[] = [];

  if (!carrier) {
    return {
      valid: false,
      errors: ["Carrier is required."]
    };
  }

  if (!carrier.id.trim()) {
    errors.push("Carrier id is required.");
  }

  if (!carrier.name.trim()) {
    errors.push("Carrier name is required.");
  }

  if (carrier.baseRateUSD < 0) {
    errors.push("Base rate cannot be negative.");
  }

  if (carrier.ratePerKgUSD < 0) {
    errors.push("Rate per kg cannot be negative.");
  }

  if (carrier.ratePerKmUSD < 0) {
    errors.push("Rate per km cannot be negative.");
  }

  if (carrier.avgDeliveryDays <= 0) {
    errors.push("Average delivery days must be greater than 0.");
  }

  if (carrier.maxWeightKg <= 0) {
    errors.push("Maximum weight must be greater than 0.");
  }

  if (carrier.onTimeRate < 0 || carrier.onTimeRate > 100) {
    errors.push("On-time rate must be between 0 and 100.");
  }

  if (carrier.operatesIn.length === 0) {
    errors.push("Carrier must operate in at least one country.");
  }

  if (carrier.acceptsPriority.length === 0) {
    errors.push("Carrier must support at least one priority level.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}