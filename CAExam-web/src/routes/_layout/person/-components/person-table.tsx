import { Link } from "@tanstack/react-router";
import useAxios from "axios-hooks";
import type { PaginatedResult, Person, GetResidence } from "@/types";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";
import { Loader } from "@/components/loader";
import { PAGE_SIZE } from "@/api";
import { useState, useEffect } from "react";
import { PageList } from "@/components/pagination";

interface Props {
  term?: string;
}

export const PersonTable = ({ term }: Props) => {
  const { auth } = useAuthStore();
  const [pageNumber, setPageNumber] = useState(1);
  const [residences, setResidences] = useState<Record<string, GetResidence>>({});

  const [{ data, loading, error }] = useAxios<PaginatedResult<Person>>(
    {
      url: getUrl(["person"]),
      params: {
        pageNumber,
        pageSize: PAGE_SIZE,
        term,
      },
      headers: createAuthHeader(auth),
    },
    { useCache: false, manual: !auth?.token }
  );

  if (error) console.error('Error fetching persons:', error);

  // Fetch residence data for each person
  useEffect(() => {
    const fetchResidences = async () => {
      if (!data?.result || !auth?.token) return;

      try {
        const residencePromises = data.result.map((person: Person) =>
          fetch(getUrl(["residence", person.residenceId]), {
            headers: {
              Authorization: `Bearer ${auth.token}`
            }
          }).then(res => res.ok ? res.json() : null)
        );

        const residenceData = await Promise.all(residencePromises);
        const residenceMap = data.result.reduce((acc: Record<string, GetResidence>, person: Person, index: number) => {
          if (residenceData[index]) {
            acc[person.id] = residenceData[index];
          }
          return acc;
        }, {});

        setResidences(residenceMap);
      } catch (error) {
        console.error('Error fetching residences:', error);
      }
    };

    fetchResidences();
  }, [data?.result, auth?.token]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {data?.result.map((person: Person) => (
          <Link
            key={person.id}
            to={"/person/$personId"}
            params={{ personId: person.id }}
            className="flex flex-col gap-2 p-4 rounded-lg border hover:bg-secondary/60"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  {person.firstName} {person.lastName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {residences[person.id] ? (
                    `${residences[person.id].city}, ${residences[person.id].street} ${residences[person.id].streetNumber}${residences[person.id].apartmentNumber ? ` - ${residences[person.id].apartmentNumber}` : ''}, ${residences[person.id].country}`
                  ) : (
                    "Loading residence..."
                  )}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {data && (
        <PageList
          pageSize={PAGE_SIZE}
          totalCount={data.total}
          pageNumber={pageNumber}
          onPageChange={setPageNumber}
        />
      )}
    </div>
  );
};
