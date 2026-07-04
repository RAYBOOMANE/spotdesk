// Promise-based confirm / alert / prompt rendered as shadcn dialogs —
// native window.confirm/prompt are unreliable inside Tauri webviews.
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Dialogs {
  confirm: (msg: React.ReactNode, opts?: { confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
  alert: (msg: React.ReactNode) => Promise<void>;
  prompt: (title: string, defaultValue?: string, placeholder?: string) => Promise<string | null>;
}

const Ctx = createContext<Dialogs | null>(null);
export function useDialogs(): Dialogs {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDialogs outside provider");
  return ctx;
}

type Pending =
  | { kind: "confirm"; msg: React.ReactNode; confirmLabel: string; danger: boolean }
  | { kind: "alert"; msg: React.ReactNode }
  | { kind: "prompt"; title: string; defaultValue: string; placeholder: string };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [promptVal, setPromptVal] = useState("");
  const resolver = useRef<(v: any) => void>();

  const confirm = useCallback<Dialogs["confirm"]>((msg, opts) => {
    setPending({ kind: "confirm", msg, confirmLabel: opts?.confirmLabel ?? "Confirm", danger: !!opts?.danger });
    return new Promise((res) => (resolver.current = res));
  }, []);
  const alert = useCallback<Dialogs["alert"]>((msg) => {
    setPending({ kind: "alert", msg });
    return new Promise((res) => (resolver.current = res));
  }, []);
  const prompt = useCallback<Dialogs["prompt"]>((title, defaultValue = "", placeholder = "") => {
    setPromptVal(defaultValue);
    setPending({ kind: "prompt", title, defaultValue, placeholder });
    return new Promise((res) => (resolver.current = res));
  }, []);

  const finish = (v: any) => {
    resolver.current?.(v);
    resolver.current = undefined;
    setPending(null);
  };

  return (
    <Ctx.Provider value={{ confirm, alert, prompt }}>
      {children}
      <Dialog
        open={!!pending}
        onOpenChange={(o) => {
          if (!o && pending) finish(pending.kind === "confirm" ? false : pending.kind === "prompt" ? null : undefined);
        }}
      >
        <DialogContent>
          {pending?.kind === "confirm" && (
            <>
              <DialogTitle className="mb-3">Confirm</DialogTitle>
              <div className="mb-5 whitespace-pre-line font-mono text-[0.7rem] leading-relaxed text-dim">
                {pending.msg}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={pending.danger ? "danger" : "default"} onClick={() => finish(true)}>
                  {pending.confirmLabel}
                </Button>
                <Button variant="ghost" onClick={() => finish(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
          {pending?.kind === "alert" && (
            <>
              <DialogTitle className="mb-3">Heads up</DialogTitle>
              <div className="mb-5 whitespace-pre-line font-mono text-[0.7rem] leading-relaxed text-dim">
                {pending.msg}
              </div>
              <Button className="w-full" onClick={() => finish(undefined)}>
                OK
              </Button>
            </>
          )}
          {pending?.kind === "prompt" && (
            <>
              <DialogTitle className="mb-3">{pending.title}</DialogTitle>
              <Input
                autoFocus
                value={promptVal}
                placeholder={pending.placeholder}
                onChange={(e) => setPromptVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && finish(promptVal)}
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => finish(promptVal)}>Save</Button>
                <Button variant="ghost" onClick={() => finish(null)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
