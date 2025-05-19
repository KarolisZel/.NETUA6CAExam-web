import { Outlet } from "@tanstack/react-router";
import { Navigation } from "./components/navigation";

export const Layout = () => {
  return (
    <>
      <Navigation />
      <div className="flex flex-col gap-2">
        <Outlet />
      </div>
    </>
  );
};
