import { createFileRoute } from "@tanstack/react-router";
import { useDebounce } from "@/components/hooks/use-debounce";
import { PersonTable } from "./-components/person-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_layout/person/")({
  component: () => <PersonPage />,
});

const PersonPage = () => {
  const [term, setTerm] = useState<string>();
  const debouncedTerm = useDebounce(term);

  return (
    <div className="bg-secondary/30 shadow-xl rounded-xl flex flex-col gap-2 p-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={term ?? ""}
          onChange={(e) => setTerm(e.target.value.trim())}
          placeholder="Search away..."
        />
        <Button
          onClick={() => {
            setTerm(undefined);
          }}
          variant="outline"
        >
          Clear Filters
        </Button>
      </div>
      <PersonTable term={debouncedTerm} />
    </div>
  );
};
