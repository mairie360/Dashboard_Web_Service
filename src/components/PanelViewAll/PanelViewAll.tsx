"use client";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@mairie360/lib-components/primitives";

/** « Voir tout » action of a standalone panel. */
export const PanelViewAll = ({ onClick, label = "Voir tout" }: { onClick: () => void; label?: string }) => (
  <LinkButton icon={ArrowRight} size="s" onClick={onClick}>{label}</LinkButton>
);
