"use client";
import { Skeleton } from "@mairie360/lib-components/primitives";

import { DashboardHeader } from '@/components/DashboardHeader';

/** The page before any confirmed data: title, status line and skeleton panels (Figma 02 « chargement »). */
export const DashboardLoading = ({ loading, failed }: { loading: boolean; failed: boolean }) => (
  <>
    <DashboardHeader showDate={false} />
    <p role="status">{failed && !loading ? "Le tableau de bord est indisponible." : "Chargement du tableau de bord…"}</p>
    {loading ? <div aria-hidden="true" className="dashboard-content-grid mt-6 grid gap-6 xl:grid-cols-2">{[0, 1, 2].map((index) => <Skeleton.Card key={index} className={index === 2 ? "xl:col-span-2" : undefined} />)}</div> : null}
  </>
);
