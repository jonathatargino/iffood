import { lazy } from "react";
import type { RouteObject } from "react-router";

const HomePage = lazy(() => import("./HomePage"));
const ViewAllResourceByTypePage = lazy(
  () => import("./ViewResourceByTypePage"),
);
const SearchPage = lazy(() => import("./SearchPage"));

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
