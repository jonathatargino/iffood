import { omitMenuLayoutPathList, omitMenuLayoutSubPathList } from "./const";

export function shouldOmitMenuLayout(pathname: string) {
  return (
    omitMenuLayoutPathList.includes(pathname) ||
    omitMenuLayoutSubPathList.some((subPath) => pathname.includes(subPath))
  );
}
