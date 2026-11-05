import Link from "next/link";

import styles from "@/components/inventory/inventory.module.css";

export default function InventoryNav() {
  return (
    <nav className={styles.nav}>
      <Link href="/inventory/products">Productos</Link>
      <Link href="/inventory/orders/inbound">Nueva entrada</Link>
      <Link href="/inventory/orders/outbound">Nueva salida</Link>
      <Link href="/inventory/orders">Historial</Link>
    </nav>
  );
}
