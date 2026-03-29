import { searchPageParamsSchema } from "./schema";

export function parseSearchPageSearchParams(searchParams: URLSearchParams) {
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type");
  const category = searchParams.get("category") || "";

  const params = { q, type, category };
  try {
    return searchPageParamsSchema.parse(params);
  } catch {
    return {
      type: "stores",
      q: undefined,
      category: undefined,
    };
  }
}
