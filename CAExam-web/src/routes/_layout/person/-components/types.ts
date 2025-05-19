// import { createAuthHeader } from "@/auth";
// import { useAuthStore } from "@/components/hooks/use-auth";
// import type { Person } from "@/types";
// import { getUrl } from "@/utils/navigation";
// import useAxios from "axios-hooks";
// import { Route } from "../$personId";

// export const SinglePerson = () => {
//   const { auth } = useAuthStore();
//   const {personId} = Route.useParams();
//   const [{ data, loading, error }] = useAxios<Person>(
//     {
//       url: getUrl(["person", personId]),
//       headers: createAuthHeader(auth),
//     },
//     { useCache: false, manual: !auth?.accessToken },
//   );
// };
