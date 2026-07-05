import { useStore } from "@/store/StoreProvider";
import { colorOf, gridDims } from "@/lib/logic";
import { openExternal } from "@/lib/backup";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";

export function CeoClientsView() {
  const { state } = useStore();
  const { nClusters, nAccts } = gridDims(state);

  const rows = [];
  for (let c = 1; c <= nClusters; c++) {
    let live = 0;
    let deployed = 0;
    for (let a = 1; a <= nAccts; a++) {
      const sp = state.spots[`${c}-${a}`];
      if (sp && sp.day >= 1) {
        live++;
        deployed += (sp.cost || 0) + (sp.extra || 0);
      }
    }
    rows.push({
      c,
      name: state.names?.[c] ?? "C" + c,
      color: colorOf(state, c),
      sheet: state.sheets?.[c] ?? "",
      live,
      total: nAccts,
      deployed,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Clients</h1>
        <p className="text-sm text-dim">Management view of every client — live accounts and deployed capital.</p>
      </div>

      <Card className="p-0">
        <Table>
          <THead>
            <tr>
              <Th>Client</Th>
              <Th>Live accounts</Th>
              <Th>Deployed capital</Th>
              <Th>Sheet</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <tr key={r.c}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="h-[9px] w-[9px] shrink-0 rounded-[2px]" style={{ background: r.color }} />
                    <span className="font-semibold text-ink">{r.name}</span>
                  </div>
                </Td>
                <Td className="text-data-sm">
                  {r.live}/{r.total}
                </Td>
                <Td className="text-data-sm text-invested">${r.deployed.toLocaleString()}</Td>
                <Td>
                  {r.sheet ? (
                    <button className="font-mono text-data-xs text-dim hover:text-ink" onClick={() => openExternal(r.sheet)}>
                      open ⊞
                    </button>
                  ) : (
                    <span className="font-mono text-data-xs text-faint">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
