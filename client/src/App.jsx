import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage.jsx";
import ClipLoader from "react-spinners/ClipLoader";
import Home from "./pages/Home/Home.jsx";

function App() {
  const { isAuthenticated } = useAuth0();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <ClipLoader size={150} color={"#26fa0f"} loading={loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50">
      <BrowserRouter>
        {isAuthenticated ? (
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        ) : (
          <Home />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
