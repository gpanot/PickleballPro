import { createBrowserRouter } from "react-router";
import { Logbook } from "./components/Logbook";
import { LogSession } from "./components/LogSession";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Logbook,
  },
  {
    path: "/log",
    Component: LogSession,
  },
]);
