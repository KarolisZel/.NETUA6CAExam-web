import { Link } from "@tanstack/react-router";
import { useAuthStore } from "./hooks/use-auth";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import useAxios from "axios-hooks";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import type { GetPerson } from "@/types";
import { Loader } from "./loader";

export const Navigation = () => {
  const { user, auth, logout } = useAuthStore();

  const [{ data: personData, loading, error: personError }] = useAxios<GetPerson>(
    {
      url: user?.id ? getUrl(["person", "user", user.id]) : getUrl("person/user/placeholder"),
      headers: createAuthHeader(auth),
    },
    { useCache: false, manual: !auth?.token || !user?.id }
  );

  if (personError) console.error("Error fetching person data:", personError);

  const displayName = personData?.firstName || user?.email?.split('@')[0] || 'User';

  if (loading) {
    return (
      <div className="flex bg-secondary/60 p-5 gap-5 items-center justify-between">
        <NavbarBrand />
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex bg-secondary/60 p-5 gap-5 items-center justify-between">
      <NavbarBrand />

      <div className="flex gap-5 items-center justify-center">
        {personData ? (
          <Link className="[&.active]:text-primary" to={"/person"}>
            People
          </Link>
        ) : (
          <Link className="[&.active]:text-primary" to={"/person/create"}>
            Create Profile
          </Link>
        )}
        {user?.role === "Admin" && (
          <Link className="[&.active]:text-primary" to={"/user"}>
            Users
          </Link>
        )}
      </div>

      <div className="flex gap-5 items-center justify-center">
        {user && (
          <>
            <Link to="/user/$userId" params={{ userId: user.id }}>
              Hello, {displayName}!
            </Link>
            <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </>
        )}
        <Button variant="destructive" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

const NavbarBrand = () => {
  return (
    <Link to="/" className="text-2xl font-bold hover:text-primary transition-colors">
      <span className="text-primary">CA</span>Exam
    </Link>
  );
};
