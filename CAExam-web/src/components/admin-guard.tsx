import { useAuthStore } from "@/components/hooks/use-auth";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export const AdminGuard = ({ children }: Props) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role && user.role !== "Admin") {
      /* empty */
    }
  }, [user]);

  return children;
};
