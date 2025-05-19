import { createFileRoute } from "@tanstack/react-router";
import { PersonForm, type PersonFormData } from "../-components/person-form";
import type { GetPerson, Person, GetResidence } from "@/types";
import useAxios from "axios-hooks";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";
import { Loader } from "@/components/loader";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_layout/person/$personId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { personId } = Route.useParams();
  const { auth, user } = useAuthStore();
  const navigate = useNavigate();

  const [{ data, loading }] = useAxios<GetPerson>(
    {
      url: getUrl(["person", personId]),
      headers: createAuthHeader(auth),
    },
    { useCache: false, manual: !auth?.token },
  );

  const [{ data: residenceData, loading: loadingResidence }] = useAxios<GetResidence>(
    {
      url: getUrl(["residence", data?.residenceId || "placeholder"]),
      headers: createAuthHeader(auth),
    },
    { useCache: false, manual: !auth?.token || !data?.residenceId },
  );

  const [, executePut] = useAxios<Person>(
    {
      url: getUrl(["person", "update", personId]),
      method: "PUT",
      headers: createAuthHeader(auth),
    },
    { manual: true }
  );

  if (!data || loading || !residenceData || loadingResidence) {
    return <Loader />;
  }

  // Check if the person belongs to the current user or if the user is an admin
  const isAuthorized = data.userId === user?.id || user?.role === "Admin";
  if (!isAuthorized) {
    toast.error("You can only edit your own profile");
    navigate({ to: "/person/$personId", params: { personId } });
    return null;
  }

  const handleSubmit = async (formData: PersonFormData) => {
    try {
      await executePut({
        data: {
          ...data,
          ...formData,
          residence: formData.residence ? {
            ...residenceData,
            ...formData.residence
          } : null
        }
      });
      toast.success("Person updated successfully!");
      navigate({ to: "/person/$personId", params: { personId } });
    } catch (error) {
      toast.error("Failed to update person");
      console.error("Update error:", error);
    }
  };

  const formInitialData: PersonFormData = {
    firstName: data.firstName,
    lastName: data.lastName,
    personCode: data.personCode,
    phoneNumber: data.phoneNumber,
    email: data.email,
    profilePhotoId: data.profilePhotoId,
    residence: residenceData ? {
      country: residenceData.country,
      city: residenceData.city,
      street: residenceData.street,
      streetNumber: residenceData.streetNumber.toString(),
      apartmentNumber: residenceData.apartmentNumber?.toString()
    } : null
  };

  return (
    <div className="max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <PersonForm initialData={formInitialData} onSubmit={handleSubmit} />
    </div>
  );
}
