import { BASE_URL } from "../api";

export const getUrl = (path: string | string[]) => {
  if (Array.isArray(path)) {
    const url = `${BASE_URL}/${path.join("/")}`;
    return url;
  }
  const url = `${BASE_URL}/${path}`;
  return url;
};
