import useAxios from "axios-hooks";
import type { Person } from "@/types";
import { getUrl } from "@/utils/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/components/hooks/use-auth";
import { Loader } from "@/components/loader";
import { useParams } from "@tanstack/react-router";

export const SinglePerson = () => {
  const { personId } = useParams({ from: "/_layout/person/$personId/" });
  const [{ data, loading, error }] = useAxios<Person>(
    getUrl(["Person", personId]),
  );

  const token = useAuthStore((state) => state.auth?.token);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!data?.profilePhotoId || !token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/image/${data.profilePhotoId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
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
  }, [data?.profilePhotoId, token]);

  if (loading) {
    return <Loader />;
  }

  if (error && !data) {
    return <p>Ooopsie...</p>;
  }

  return (
    <div className="hero bg-base-200">
      <div className="hero-content">
        <img
          src={imageSrc || ""}
          alt="Profile"
          className="max-w-sm rounded-lg shadow-2xl object-scale-down h-75 w-48"
        />
        <div>
          <h1 className="text-5xl font-bold">
            {data?.firstName + " " + data?.lastName}
          </h1>
          <p>
            Lives at: {data?.residence?.city ?? "Unknown"}, {data?.residence?.street ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
};
