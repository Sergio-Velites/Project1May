import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./state/store";
import App from "./App";
import GlobalStyles from "./styles/GlobalStyles";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// ── Versión del bundle (sustituido en cada build por CRA) ──────────────────
console.info(
  `%c[WeddingBoy] build: ${process.env.REACT_APP_BUILD_TIME ?? new Date().toISOString()} │ env: ${process.env.NODE_ENV}`,
  "color: #4f50db; font-weight: bold"
);

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <GlobalStyles />
      <App />
    </Provider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
