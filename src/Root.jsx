import { useEffect } from "react";
import { useRoute } from "./hooks/useRoute.js";
import { useTheme } from "./hooks/useTheme.js";
import { LoginModal } from "./context/AuthContext.jsx";
import { GlobalNav } from "./components/GlobalNav.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { PlansPage } from "./pages/PlansPage.jsx";
import App from "./App.jsx";

export default function Root() {
  const [route, navigate] = useRoute();
  const [theme, toggleTheme] = useTheme();
  const top = route.split("/")[0] || "home";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [top]);

  let page;
  if (top === "home" || top === "") {
    page = <LandingPage navigate={navigate} />;
  } else if (top === "plans") {
    page = <PlansPage navigate={navigate} />;
  } else {
    page = <App />;
  }

  return (
    <>
      <GlobalNav route={top} navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
      <main>{page}</main>
      <LoginModal />
    </>
  );
}
