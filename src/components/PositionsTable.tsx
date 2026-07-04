import { Card } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { useStore } from "@/store/StoreProvider";
import { positionRows, zoneColorVar } from "@/lib/stats";

export function PositionsTable({ onOpenSpot }: { onOpenSpot: (id: string) => void }) {
  const { state } = useStore();
  const rows = positionRows(state);
  return (
    <Card className="overflow-hidden">
      <div className="max-h-[320px] overflow-y-auto">
        <Table>
          <THead>
            <tr>
              <Th>Account</Th>
              <Th>Cluster</Th>
              <Th>Day</Th>
              <Th className="text-right">Tied up</Th>
              <Th className="text-right">Fwd EV</Th>
            </tr>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={5} className="py-5 text-center text-faint">
                  No active positions.
                </Td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer transition-colors hover:bg-panel2"
                  onClick={() => onOpenSpot(r.id)}
                >
                  <Td className="text-dim">
                    C{r.c}·A{r.a}
                  </Td>
                  <Td>{r.name}</Td>
                  <Td>
                    <b style={{ color: zoneColorVar(r.day) }}>D{r.day}</b>
                  </Td>
                  <Td className="text-right">${r.tied.toLocaleString()}</Td>
                  <Td className="text-right text-gold">~${r.fwd.toFixed(0)}</Td>
                </tr>
              ))
            )}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
