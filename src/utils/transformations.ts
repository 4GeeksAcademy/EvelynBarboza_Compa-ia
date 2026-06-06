import { Carrier, Product, Shipment } from "../types/models";

const PRIORITY_MULTIPLIERS = {
  Standard: 1,
  Express: 1.3,
  "Same-day": 1.6
} as const;


////////////////// CALCULAR COSTO DE ENVÍO //////////////////
export function calculateShippingCost(
  shipment: Shipment,
  product: Product,
  carrier: Carrier
): number {

  if (!shipment || !product || !carrier) {
    return 0;
  }

  const baseCost = carrier.baseRateUSD;

  const weightCost =
    product.weightKg *
    carrier.ratePerKgUSD *
    shipment.quantity;

  const distanceCost =
    shipment.destination.distanceKm *
    carrier.ratePerKmUSD;

  const subtotal =
    baseCost +
    weightCost +
    distanceCost;

  const total =
    subtotal *
    PRIORITY_MULTIPLIERS[shipment.priority];

  return Number(total.toFixed(2));
}

////////////////// CALCULAR PUNTAJE DE TRANSPORTISTA //////////////////
export function scoreCarrierForShipment(
  carrier: Carrier,
  shipment: Shipment,
  product: Product
): number {

  if (!carrier || !shipment || !product) {
    return 0;
  }

  let score = 0;

  if (
    carrier.operatesIn.includes(
      shipment.destination.country
    )
  ) {
    score += 20;
  }

  const totalWeight =
    product.weightKg *
    shipment.quantity;

  if (totalWeight <= carrier.maxWeightKg) {
    score += 20;
  }

  if (
    carrier.acceptsPriority.includes(
      shipment.priority
    )
  ) {
    score += 15;
  }

  if (
    !product.isFragile ||
    carrier.handlesFragile
  ) {
    score += 15;
  }

  score += carrier.onTimeRate * 0.3;

  return Number(score.toFixed(2));
}

////////////////// SELECCIONAR MEJOR TRANSPORTISTA //////////////////
export function selectBestCarrier(
  carriers: Carrier[],
  shipment: Shipment,
  product: Product
): {
  carrier: Carrier;
  score: number;
  cost: number;
} | null {

  if (!carriers || carriers.length === 0) {
    return null;
  }

  const suitableCarriers = carriers
    .map((carrier) => ({
      carrier,
      score: scoreCarrierForShipment(
        carrier,
        shipment,
        product
      ),
      cost: calculateShippingCost(
        shipment,
        product,
        carrier
      )
    }))
    .filter((result) => result.score >= 50);

  if (suitableCarriers.length === 0) {
    return null;
  }

  return suitableCarriers.reduce((best, current) =>
    current.cost < best.cost
      ? current
      : best
  );
}