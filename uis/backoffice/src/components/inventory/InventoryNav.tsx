import Link from "next/link";

import styles from "@/components/inventory/inventory.module.css";

export default function InventoryNav() {
  return (
    <nav className={styles.nav}>
      <Link href="/inventory/products">Productos</Link>
      <Link className={styles.navInbound} href="/inventory/orders/inbound">
        Nueva entrada
      </Link>
      <Link className={styles.navOutbound} href="/inventory/orders/outbound">
        Nueva salida
      </Link>
      <Link href="/inventory/orders">Historial</Link>
    </nav>
  );
}
