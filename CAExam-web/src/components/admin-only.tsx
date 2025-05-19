import { useAuthStore } from "@/components/hooks/use-auth";

interface Props {
  children: React.ReactNode;
}

export const AdminOnly = ({ children }: Props) => {
  const { user } = useAuthStore();

  return user?.role === "Admin" ? children : null;
};
