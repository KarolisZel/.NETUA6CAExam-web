import { createFileRoute } from "@tanstack/react-router";
import useAxios from "axios-hooks";
import type { UserData } from "@/auth";
import type { GetPerson, PaginatedResult } from "@/types";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";
import { Loader } from "@/components/loader";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { PageList } from "@/components/pagination";
import { PAGE_SIZE } from "@/api";
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
} from "@/components/ui/alert-dialog";

interface UserWithPerson extends UserData {
    personData?: GetPerson;
}

export const Route = createFileRoute("/_layout/user/")({
    component: UsersPage,
});

function UsersPage() {
    const { auth, user } = useAuthStore();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [usersWithPerson, setUsersWithPerson] = useState<UserWithPerson[]>([]);
    const [isLoadingPersonData, setIsLoadingPersonData] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    const [{ data: usersData, loading, error }] = useAxios<PaginatedResult<UserData>>(
        {
            url: getUrl(["user", "all"]),
            params: {
                pageNumber: currentPage,
                pageSize: PAGE_SIZE,
            },
            headers: createAuthHeader(auth) as Record<string, string>,
        },
        { useCache: false, manual: !auth?.token }
    );

    // Fetch person data for each user
    useEffect(() => {
        const fetchPersonData = async () => {
            if (!usersData?.result || !auth?.token) return;
            setIsLoadingPersonData(true);

            try {
                const personDataPromises = usersData.result.map(user =>
                    fetch(getUrl(["person", "user", user.id]), {
                        headers: createAuthHeader(auth) as Record<string, string>
                    }).then(async res => {
                        if (res.status === 404) {
                            // User doesn't have a person profile yet
                            return null;
                        }
                        if (!res.ok) {
                            throw new Error(`Failed to fetch person data for user ${user.id}`);
                        }
                        return res.json();
                    }).catch(error => {
                        console.error(`Error fetching person data for user ${user.id}:`, error);
                        return null;
                    })
                );

                const personDataList = await Promise.all(personDataPromises);
                const combinedData = usersData.result.map((user, index) => ({
                    ...user,
                    personData: personDataList[index],
                }));

                setUsersWithPerson(combinedData);
            } catch (error) {
                console.error('Error fetching person data:', error);
                toast.error("Failed to load some user profiles");
            } finally {
                setIsLoadingPersonData(false);
            }
        };

        fetchPersonData();
    }, [usersData?.result, auth]);

    // Check if user is admin
    useEffect(() => {
        if (user && user.role !== "Admin") {
            toast.error("You don't have permission to access this page");
            navigate({ to: "/" });
        }
    }, [user, navigate]);

    const handleDelete = async (userId: string) => {
        if (!auth?.token) {
            toast.error("Authentication required");
            return;
        }

        try {
            const response = await fetch(getUrl(["user", userId]), {
                method: "DELETE",
                headers: createAuthHeader(auth) as Record<string, string>
            });

            if (response.ok) {
                toast.success("User deleted successfully");
                // Remove the deleted user from the list
                setUsersWithPerson(prev => prev.filter(u => u.id !== userId));
            } else {
                const errorData = await response.json().catch(() => null);
                toast.error(errorData?.message || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("An error occurred while deleting the user");
        } finally {
            setUserToDelete(null);
        }
    };

    if (loading || isLoadingPersonData) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold text-red-500">Error loading users</h1>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        );
    }

    if (!usersData) {
        return null;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Users Management</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {usersWithPerson.map((u) => (
                    <Link
                        key={u.id}
                        to="/user/$userId"
                        params={{ userId: u.id }}
                        className="block transition-transform hover:scale-[1.02]"
                    >
                        <Card className="h-full cursor-pointer hover:bg-accent/50">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>{u.userName}</CardTitle>
                                    <Badge variant={u.role === "Admin" ? "default" : "secondary"}>
                                        {u.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-muted-foreground">Email: </span>
                                        {u.email}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Phone: </span>
                                        {u.phoneNumber || "Not provided"}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Profile: </span>
                                        {u.personData ? (
                                            <button
                                                type="button"
                                                className="text-primary hover:underline bg-transparent p-0 m-0 border-0"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    if (u.personData) {
                                                        navigate({
                                                            to: "/person/$personId",
                                                            params: { personId: u.personData.id }
                                                        });
                                                    }
                                                }}
                                            >
                                                View Profile
                                            </button>
                                        ) : (
                                            <span>No profile</span>
                                        )}
                                    </div>
                                    {(user?.role === "Admin" || user?.id === u.id) && (
                                        <div className="pt-2">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setUserToDelete(u);
                                                }}
                                            >
                                                Delete User
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            <div className="mt-4">
                <PageList
                    pageSize={PAGE_SIZE}
                    totalCount={usersData.total}
                    pageNumber={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            {userToDelete?.userName && ` "${userToDelete.userName}"`} and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => userToDelete && handleDelete(userToDelete.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 