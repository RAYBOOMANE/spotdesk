import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./index.css";
import App from "./App";
import { StoreProvider } from "./store/StoreProvider";
import { ConfirmProvider } from "./components/ConfirmProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </StoreProvider>
  </React.StrictMode>
);
