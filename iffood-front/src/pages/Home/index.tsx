import { lazy } from "react";
import type { RouteObject } from "react-router";

const HomePage = lazy(() => import("./HomePage"));
const SearchPage = lazy(() => import("./SearchPage"));

export const homeRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "busca",
    element: <SearchPage />,
  },
];
