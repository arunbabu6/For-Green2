import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain="shav-xmdaoxl28shfvujc.eu.auth0.com"
      clientId="5yXz2d4lu0jDphHoR3HtgtfOQuFTlPGu"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      screen_hint="signup"
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
);
