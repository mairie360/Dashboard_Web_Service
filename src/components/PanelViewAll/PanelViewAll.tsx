"use client";
import { LinkButton } from "@mairie360/lib-components/primitives";

/** « Voir tout » action of a standalone panel (text link without arrow, MAIR-1107). */
export const PanelViewAll = ({ onClick, label = "Voir tout" }: { onClick: () => void; label?: string }) => (
  <LinkButton size="s" onClick={onClick}>{label}</LinkButton>
);
