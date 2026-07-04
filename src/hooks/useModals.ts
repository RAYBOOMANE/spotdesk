import { useState } from "react";

export function useModals() {
  const [logId, setLogId] = useState<string | null>(null);
  const [multiOpen, setMultiOpen] = useState(false);
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [capOpen, setCapOpen] = useState(false);

  return {
    logId,
    openLog: (id: string) => setLogId(id),
    closeLog: () => setLogId(null),

    multiOpen,
    openMulti: () => setMultiOpen(true),
    closeMulti: () => setMultiOpen(false),

    dayIdx,
    openDay: (idx: number) => setDayIdx(idx),
    closeDay: () => setDayIdx(null),

    capOpen,
    openCap: () => setCapOpen(true),
    closeCap: () => setCapOpen(false),
  };
}
