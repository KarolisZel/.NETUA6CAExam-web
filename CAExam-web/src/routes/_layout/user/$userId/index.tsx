import { createFileRoute } from '@tanstack/react-router'
import useAxios from "axios-hooks";
import type { UserData } from "@/auth";
import type { GetPerson } from "@/types";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

export const Route = createFileRoute('/_layout/user/$userId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { userId } = Route.useParams();
  const { auth, user: authUser } = useAuthStore();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [{ data: userData, loading: userLoading, error: userError }, refetchUser] = useAxios<UserData>(
    {
      url: getUrl(["user", userId]),
      headers: createAuthHeader(auth),
    },
    { useCache: false, manual: !auth?.token },
  );

  const [{ data: personData, loading: personLoading, error: personError }, refetchPerson] = useAxios<GetPerson>(
    {
      url: getUrl(["person", "user", userId]),
      headers: createAuthHeader(auth),
    },
    { useCache: false, manual: !auth?.token },
  );

  // Keep error logging for debugging
  if (userError) console.error("User fetch error:", userError);
  if (personError) console.error("Person fetch error:", personError);

  // Refetch when auth token changes
  useEffect(() => {
    if (auth?.token) {
      refetchUser();
      refetchPerson();
    }
  }, [auth?.token, refetchUser, refetchPerson]);

  if (!userData || userLoading || personLoading) {
    return <Loader />;
  }

  // Combine user data with person data
  const displayUser = {
    ...userData,
    person: personData || undefined
  };

  // Authorization: admin or self
  const canDelete = authUser?.role === "Admin" || authUser?.id === userId;

  const handleDelete = async () => {
    if (!auth?.token) {
      toast.error("Authentication required");
      return;
    }

    setDeleting(true);
    try {
      const headers = {
        ...createAuthHeader(auth),
        'Content-Type': 'application/json'
      } as Record<string, string>;

      const response = await fetch(getUrl(["user", userId]), {
        method: "DELETE",
        headers
      });

      if (response.status === 403) {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || "You don't have permission to delete this user");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || "Failed to delete user");
        return;
      }

      toast.success("User deleted successfully");
      // If user deletes their own account, redirect to login
      if (authUser?.id === userId) {
        navigate({ to: "/login" });
      } else {
        // If admin deletes another user, redirect to user list
        navigate({ to: "/user" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting the user");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Card className="w-[600px] mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">User Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </div>
          <Badge variant={displayUser?.role === "Admin" ? "default" : "secondary"}>
            {displayUser?.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Account Details</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Username</div>
            <div>{displayUser?.userName}</div>
            <div className="text-muted-foreground">Email</div>
            <div>{displayUser?.email}</div>
            <div className="text-muted-foreground">Phone Number</div>
            <div>{displayUser?.phoneNumber || "Not provided"}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Person Profile Status</h3>
          {displayUser?.person ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">Profile Created</Badge>
                <span className="text-muted-foreground">
                  Profile is linked to {displayUser.person.firstName} {displayUser.person.lastName}
                </span>
              </div>
              <Link
                to="/person/$personId"
                params={{ personId: displayUser.person.id }}
                className="block w-fit"
              >
                <Button>View Profile</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">No Profile</Badge>
                <span className="text-muted-foreground">
                  You haven't created a person profile yet
                </span>
              </div>
              <Link to="/person/create" className="block w-fit">
                <Button>Create Profile</Button>
              </Link>
            </div>
          )}
        </div>

        {displayUser?.firstTimeLogin && (
          <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-4 text-yellow-600 dark:text-yellow-400">
            Welcome! Please take a moment to complete your profile.
          </div>
        )}

        {canDelete && (
          <div className="pt-4">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={deleting}>
              Delete User
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user
                    {displayUser?.userName && ` "${displayUser.userName}"`} and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
