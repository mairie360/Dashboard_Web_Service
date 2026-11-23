"use client";
import { Skeleton } from "@mairie360/lib-components/primitives";

export type DashboardRowSkeletonKind = "project" | "task" | "event";

/**
 * Placeholder of one compact row while the dashboard loads (Figma « Composants locaux – Dashboard »,
 * MAIR-899): same box as the real row, so nothing moves when the data arrives. The lib Skeleton only
 * shimmers for users who allow motion.
 */
export const DashboardRowSkeleton = ({ kind }: { kind: DashboardRowSkeletonKind }) => (
  <div aria-hidden="true" data-skeleton={kind} className={`dashboard-row dashboard-row-skeleton dashboard-${kind}-row`}>
    {kind === "event" ? <Skeleton shape="block" size="l" className="dashboard-event-date" animated /> : null}
    <span className="min-w-0 flex-1">
      <span className="dashboard-row-line"><Skeleton size="m" style={{ width: "60%" }} animated />{kind === "event" ? null : <Skeleton size="m" style={{ width: "4rem" }} animated />}</span>
      <span className="dashboard-row-line"><Skeleton size="s" style={{ width: "40%" }} animated />{kind === "project" ? <Skeleton size="s" style={{ width: "33%" }} animated /> : null}</span>
    </span>
  </div>
);

/** The rows a loading tile shows (3, the tile capacity). */
export const DashboardRowSkeletons = ({ kind, count = 3 }: { kind: DashboardRowSkeletonKind; count?: number }) => (
  <>{Array.from({ length: count }, (_, index) => <DashboardRowSkeleton key={index} kind={kind} />)}</>
);
