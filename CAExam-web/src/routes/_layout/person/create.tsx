import { createFileRoute } from "@tanstack/react-router";
import { PersonForm, type PersonFormData } from "./-components/person-form";
import useAxios from "axios-hooks";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import type { Person } from "@/types";

export const Route = createFileRoute("/_layout/person/create")({
    component: CreatePersonPage,
});

function CreatePersonPage() {
    const { auth, user } = useAuthStore();
    const navigate = useNavigate();

    const [, executeCreate] = useAxios<Person>(
        {
            url: getUrl(["person", "Create"]),
            method: "POST",
            headers: createAuthHeader(auth),
        },
        { manual: true }
    );

    const handleSubmit = async (formData: PersonFormData) => {
        if (!user) {
            toast.error("You must be logged in to create a profile");
            return;
        }

        try {
            await executeCreate({
                data: {
                    userId: user.id,
                    ...formData
                }
            });

            // After creating the person, fetch their data to get the ID
            const response = await fetch(getUrl(["person", "user", user.id]), {
                headers: createAuthHeader(auth) as Record<string, string>
            });

            if (!response.ok) {
                throw new Error("Failed to fetch created person data");
            }

            const personData = await response.json();

            if (!personData?.id) {
                throw new Error("No person ID returned from server");
            }

            // Update user data with the new person information
            const userResponse = await fetch(getUrl(["user", "me"]), {
                headers: createAuthHeader(auth) as Record<string, string>
            });

            if (!userResponse.ok) {
                throw new Error("Failed to fetch updated user data");
            }

            const updatedUserData = await userResponse.json();
            useAuthStore.getState().updateUser(updatedUserData);

            toast.success("Profile created successfully!");
            navigate({
                to: "/person/$personId",
                params: { personId: personData.id }
            });
        } catch (error: any) {
            console.error("Create error:", error);
            if (error.response) {
                console.error('Server response:', error.response.data);
            }
            toast.error("Failed to create profile");
        }
    };

    return (
        <div className="max-w-2xl p-4">
            <h1 className="text-2xl font-bold mb-6">Create Your Profile</h1>
            <PersonForm onSubmit={handleSubmit} />
        </div>
    );
} 