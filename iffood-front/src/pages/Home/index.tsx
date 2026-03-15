import type { RouteObject } from "react-router";
import { HomePage } from "./HomePage";
import ViewAllResourceByTypePage from "./ViewResourceByTypePage";
import SearchPage from "./SearchPage";

export const homeRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: ":type",
    element: <ViewAllResourceByTypePage />,
  },
  {
    path: "busca",
    element: <SearchPage />,
  },
];
