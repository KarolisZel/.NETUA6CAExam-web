import { createFileRoute } from "@tanstack/react-router";
import useAxios from "axios-hooks";
import type { GetPerson, GetResidence } from "@/types";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";
import { Loader } from "@/components/loader";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_layout/person/$personId/")({
  component: () => <PersonPage />,
});

const PersonPage = () => {
  const { personId } = Route.useParams();
  const { auth, user } = useAuthStore();
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [{ data: personData, error: personError }] = useAxios<GetPerson>({
    url: getUrl(["person", personId]),
    headers: createAuthHeader(auth),
  });

  const [{ data: residenceData, loading: loadingResidence }] =
    useAxios<GetResidence>(
      {
        url: getUrl(["residence", personData?.residenceId || "placeholder"]),
        headers: createAuthHeader(auth),
      },
      { manual: !auth?.token || !personData?.residenceId },
    );

  const [, executeDelete] = useAxios<boolean>(
    {
      url: getUrl(["person", personId]),
      method: "DELETE",
      headers: createAuthHeader(auth),
    },
    { manual: true }
  );

  // Debug logs
  useEffect(() => {
    console.log('Auth token:', !!auth?.token);
    console.log('Person data:', personData);
    console.log('Residence ID:', personData?.residenceId);
    console.log('Residence data:', residenceData);
  }, [auth?.token, personData, residenceData]);

  useEffect(() => {
    const fetchImage = async () => {
      if (!personData?.profilePhotoId || !auth?.token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/image/${personData.profilePhotoId}`,
          {
            headers: {
              Authorization: `Bearer ${auth?.token}`,
            },
          },
        );

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      } catch (err) {
        console.error("Image fetch error", err);
      }
    };

    fetchImage();
  }, [personData?.profilePhotoId, auth?.token]);

  const handleDelete = async () => {
    // Check if the person belongs to the current user or if the user is an admin
    const isAuthorized = personData?.userId === user?.id || user?.role === "Admin";
    if (!isAuthorized) {
      toast.error("You can only delete your own profile");
      return;
    }

    try {
      const { data: success } = await executeDelete();

      if (success) {
        toast.success("Person deleted successfully!");
        navigate({ to: "/person" });
      } else {
        toast.error("Failed to delete person - operation was not successful");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Person not found");
      } else {
        toast.error("Failed to delete person - " + (error.response?.data || "unknown error"));
      }
      console.error("Delete error:", error);
    }
  };

  if (personError) console.error("Error fetching person data:", personError);

  if (!personData || loadingResidence) {
    return <Loader />;
  }

  // Check if the current user is authorized to edit/delete this person
  const isAuthorized = personData.userId === user?.id || user?.role === "Admin";

  return (
    <div className="bg-secondary/30 shadow-xl rounded-xl flex flex-col gap-2 p-2">
      <img
        src={imageSrc ?? undefined}
        alt="Oopsie, image wasn't good"
        className="max-w-sm rounded-lg shadow-2xl object-scale-down h-75 w-64"
      />
      <div className="flex flex-col gap-7">
        <h1 className="text-5xl font-bold">
          {personData.firstName + " " + personData.lastName}
        </h1>
        <div className="font-semibold">Person code: {personData.personCode}</div>
        <div className="font-semibold">Phone: {personData.phoneNumber}</div>
        <div className="font-semibold">Email: {personData.email}</div>
        <div className="font-semibold">
          Residence:
          {residenceData
            ? `${residenceData.street} ${residenceData.streetNumber}${residenceData.apartmentNumber
              ? `, Apt ${residenceData.apartmentNumber}`
              : ""
            } | ${residenceData.city}, ${residenceData.country}`
            : "Loading..."}
        </div>
      </div>

      {isAuthorized && (
        <div className="flex gap-2">
          <Link
            to="/person/$personId/edit"
            params={{ personId: personData.id }}
            className="w-fit"
          >
            <Button>Update Person</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Person</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this person
                  and all associated data from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
