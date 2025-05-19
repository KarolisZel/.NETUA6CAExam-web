import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const TableHeader = () => {
  const [term, setTerm] = useState<string>();

  return (
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
  );
};
