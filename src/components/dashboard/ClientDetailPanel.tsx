import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { clientProfileOf } from "@/lib/logic";
import type { ClientProfile, PaymentMethod, PaymentMethodType, WithdrawalMethod, WithdrawalMethodType } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type CoreFields = Partial<Pick<ClientProfile, "firstName" | "familyName" | "address" | "vpsLocation">>;

const fieldClass =
  "rounded border border-line bg-panel2 px-2 py-1 font-mono text-[0.7rem] text-ink placeholder:text-faint focus:border-line2 focus:outline-none";

function PaymentMethodRow({ cluster, pm }: { cluster: number; pm: PaymentMethod }) {
  const store = useStore();
  const update = (patch: Partial<PaymentMethod>) => store.updatePaymentMethod(cluster, pm.id, patch);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pm.type}
          onChange={(e) => update({ type: e.target.value as PaymentMethodType })}
          className={`${fieldClass} w-24 shrink-0`}
        >
          <option value="card">Card</option>
          <option value="bank">Bank</option>
          <option value="crypto">Crypto</option>
          <option value="other">Other</option>
        </select>
        <input
          value={pm.label}
          placeholder="Label (e.g. Visa ...4242)"
          onChange={(e) => update({ label: e.target.value })}
          className={`${fieldClass} w-44 shrink-0`}
        />
        <button
          className="ml-auto shrink-0 rounded p-1 text-faint transition-colors hover:bg-panel2 hover:text-loss"
          onClick={() => store.removePaymentMethod(cluster, pm.id)}
          title="remove"
        >
          ✕
        </button>
      </div>

      {pm.type === "card" ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={pm.cardNumber ?? ""}
            placeholder="Card number"
            onChange={(e) => update({ cardNumber: e.target.value })}
            className={`${fieldClass} w-44`}
          />
          <input
            value={pm.cardExpiry ?? ""}
            placeholder="Expiry MM/YY"
            onChange={(e) => update({ cardExpiry: e.target.value })}
            className={`${fieldClass} w-24`}
          />
          <input
            value={pm.cardholderName ?? ""}
            placeholder="Cardholder name"
            onChange={(e) => update({ cardholderName: e.target.value })}
            className={`${fieldClass} w-40`}
          />
          <input
            value={pm.linkedWallet?.network ?? ""}
            placeholder="Linked wallet network (optional)"
            onChange={(e) => update({ linkedWallet: { network: e.target.value, address: pm.linkedWallet?.address ?? "" } })}
            className={`${fieldClass} w-48`}
          />
          <input
            value={pm.linkedWallet?.address ?? ""}
            placeholder="Linked wallet address"
            onChange={(e) => update({ linkedWallet: { network: pm.linkedWallet?.network ?? "", address: e.target.value } })}
            className={`${fieldClass} flex-1`}
          />
        </div>
      ) : (
        <input
          value={pm.details}
          placeholder="Details (account / wallet)"
          onChange={(e) => update({ details: e.target.value })}
          className={`${fieldClass} w-full`}
        />
      )}
    </div>
  );
}

function WithdrawalMethodRow({ cluster, wm }: { cluster: number; wm: WithdrawalMethod }) {
  const store = useStore();
  const update = (patch: Partial<WithdrawalMethod>) => store.updateWithdrawalMethod(cluster, wm.id, patch);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={wm.type}
          onChange={(e) => update({ type: e.target.value as WithdrawalMethodType })}
          className={`${fieldClass} w-24 shrink-0`}
        >
          <option value="iban">IBAN</option>
          <option value="crypto">Crypto</option>
        </select>
        <input
          value={wm.label}
          placeholder="Label"
          onChange={(e) => update({ label: e.target.value })}
          className={`${fieldClass} w-44 shrink-0`}
        />
        <button
          className="ml-auto shrink-0 rounded p-1 text-faint transition-colors hover:bg-panel2 hover:text-loss"
          onClick={() => store.removeWithdrawalMethod(cluster, wm.id)}
          title="remove"
        >
          ✕
        </button>
      </div>

      {wm.type === "iban" ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={wm.iban ?? ""}
            placeholder="IBAN"
            onChange={(e) => update({ iban: e.target.value })}
            className={`${fieldClass} w-56`}
          />
          <input
            value={wm.bankName ?? ""}
            placeholder="Bank name"
            onChange={(e) => update({ bankName: e.target.value })}
            className={`${fieldClass} w-40`}
          />
          <input
            value={wm.accountHolder ?? ""}
            placeholder="Account holder"
            onChange={(e) => update({ accountHolder: e.target.value })}
            className={`${fieldClass} w-40`}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            value={wm.network ?? ""}
            placeholder="Network (e.g. USDT TRC20)"
            onChange={(e) => update({ network: e.target.value })}
            className={`${fieldClass} w-48`}
          />
          <input
            value={wm.address ?? ""}
            placeholder="Wallet address"
            onChange={(e) => update({ address: e.target.value })}
            className={`${fieldClass} flex-1`}
          />
        </div>
      )}
    </div>
  );
}

// CEO Office → Clients expanded detail sheet. Pure metadata (name/address/
// VPS/payments/withdrawals/logins) — never read by any trading calculation
// in src/lib.
export function ClientDetailPanel({ cluster }: { cluster: number }) {
  const store = useStore();
  const { state } = store;
  const profile = clientProfileOf(state, cluster);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [familyName, setFamilyName] = useState(profile.familyName);
  const [address, setAddress] = useState(profile.address);
  const [vpsLocation, setVpsLocation] = useState(profile.vpsLocation);
  const [vpsIp, setVpsIp] = useState(profile.vpsInfo.ipAddress);
  const [vpsUser, setVpsUser] = useState(profile.vpsInfo.username);
  const [vpsPass, setVpsPass] = useState(profile.vpsInfo.password);

  const commit = (patch: CoreFields) => store.setClientProfileField(cluster, patch);

  return (
    <div className="flex flex-col gap-5 border-t border-line bg-panel2/40 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>First name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={() => commit({ firstName })} />
        </div>
        <div>
          <Label>Family name</Label>
          <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} onBlur={() => commit({ familyName })} />
        </div>
        <div>
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => commit({ address })} />
        </div>
        <div>
          <Label>VPS location</Label>
          <Input value={vpsLocation} onChange={(e) => setVpsLocation(e.target.value)} onBlur={() => commit({ vpsLocation })} />
        </div>
        <div>
          <Label>VPS IP address</Label>
          <Input value={vpsIp} onChange={(e) => setVpsIp(e.target.value)} onBlur={() => store.setVpsInfo(cluster, { ipAddress: vpsIp })} />
        </div>
        <div>
          <Label>VPS username</Label>
          <Input value={vpsUser} onChange={(e) => setVpsUser(e.target.value)} onBlur={() => store.setVpsInfo(cluster, { username: vpsUser })} />
        </div>
        <div>
          <Label>VPS password</Label>
          <Input value={vpsPass} onChange={(e) => setVpsPass(e.target.value)} onBlur={() => store.setVpsInfo(cluster, { password: vpsPass })} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Payment methods ({profile.paymentMethods.length})
          </span>
          <button
            className="rounded-lg border border-line bg-panel px-2.5 py-1 text-[0.64rem] font-bold text-dim transition-colors hover:border-line2 hover:text-ink"
            onClick={() => store.addPaymentMethod(cluster, { type: "other", label: "", details: "" })}
          >
            + Add payment method
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {profile.paymentMethods.map((pm) => (
            <PaymentMethodRow key={pm.id} cluster={cluster} pm={pm} />
          ))}
          {profile.paymentMethods.length === 0 && (
            <p className="font-mono text-data-xs text-faint">No payment methods yet.</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Withdrawal methods ({profile.withdrawalMethods.length})
          </span>
          <button
            className="rounded-lg border border-line bg-panel px-2.5 py-1 text-[0.64rem] font-bold text-dim transition-colors hover:border-line2 hover:text-ink"
            onClick={() => store.addWithdrawalMethod(cluster, { type: "iban", label: "" })}
          >
            + Add withdrawal method
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {profile.withdrawalMethods.map((wm) => (
            <WithdrawalMethodRow key={wm.id} cluster={cluster} wm={wm} />
          ))}
          {profile.withdrawalMethods.length === 0 && (
            <p className="font-mono text-data-xs text-faint">No withdrawal methods yet.</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            App logins ({profile.appLogins.length})
          </span>
          <button
            className="rounded-lg border border-line bg-panel px-2.5 py-1 text-[0.64rem] font-bold text-dim transition-colors hover:border-line2 hover:text-ink"
            onClick={() => store.addAppLogin(cluster, { label: "", username: "", password: "" })}
          >
            + Add login
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {profile.appLogins.map((login) => (
            <div key={login.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2">
              <input
                value={login.label}
                placeholder="App (e.g. MT5 - Broker X)"
                onChange={(e) => store.updateAppLogin(cluster, login.id, { label: e.target.value })}
                className={`${fieldClass} w-36 shrink-0`}
              />
              <input
                value={login.username}
                placeholder="Username / email"
                onChange={(e) => store.updateAppLogin(cluster, login.id, { username: e.target.value })}
                className={`${fieldClass} w-40 shrink-0`}
              />
              <input
                value={login.password}
                placeholder="Password"
                onChange={(e) => store.updateAppLogin(cluster, login.id, { password: e.target.value })}
                className={`${fieldClass} w-32 shrink-0`}
              />
              <input
                value={login.notes ?? ""}
                placeholder="Notes (optional)"
                onChange={(e) => store.updateAppLogin(cluster, login.id, { notes: e.target.value })}
                className={`${fieldClass} min-w-[8rem] flex-1`}
              />
              <button
                className="shrink-0 rounded p-1 text-faint transition-colors hover:bg-panel2 hover:text-loss"
                onClick={() => store.removeAppLogin(cluster, login.id)}
                title="remove"
              >
                ✕
              </button>
            </div>
          ))}
          {profile.appLogins.length === 0 && <p className="font-mono text-data-xs text-faint">No app logins yet.</p>}
        </div>
      </div>
    </div>
  );
}
