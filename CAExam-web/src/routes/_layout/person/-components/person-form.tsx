import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent } from "react";
import { getUrl } from "@/utils/navigation";
import { createAuthHeader } from "@/auth";
import { useAuthStore } from "@/components/hooks/use-auth";

const residenceSchema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  street: z.string().min(1, "Street is required"),
  streetNumber: z.string().min(1, "Street number is required"),
  apartmentNumber: z.string().optional(),
});

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  personCode: z.string().min(7).max(13),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email(),
  profilePhotoId: z.string().optional(),
  residence: residenceSchema.nullable(),
});

export type PersonFormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: PersonFormData) => void;
  initialData?: PersonFormData;
}

export const PersonForm = ({ onSubmit, initialData }: Props) => {
  const form = useForm<PersonFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const { auth } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  // optional: error handling
  const [error, setError] = useState<string | null>(null);

  // when the user picks a file, save it to state
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setFile(e.target.files[0]);
    setError(null);
    // Clear profilePhotoId when a new file is selected
    form.setValue("profilePhotoId", undefined);
  };

  // Handle the overall form submission, including file upload
  const handleFormSubmit = async (data: PersonFormData) => {
    if (file) {
      // If a file is selected, upload it first
      const formData = new FormData();
      formData.append("Image", file);

      try {
        const res = await fetch(getUrl(["Image", "Upload"]), {
          method: "POST",
          headers: createAuthHeader(auth) as Record<string, string>,
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${res.status} - ${text}`);
        }

        const imageId: string = await res.json();
        // Update the form data with the uploaded image ID
        data.profilePhotoId = imageId;
      } catch (err) {
        console.error(err);
        setError("Upload failed");
        // Prevent submitting the main form if file upload fails
        return;
      }
    }

    // Submit the main form data
    onSubmit(data);
  };

  return (
    <Form {...form}>
      {/* Use the main form's onSubmit handler */}
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input
                  placeholder="First name..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Last name..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Email..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>National Identification Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="NI Number..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Phone number..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File upload integrated into the main form */}
        <FormItem>
          <FormLabel>Profile Photo</FormLabel>
          <FormControl>
            <Input type="file" accept=".png,.jpg" onChange={handleFileChange} />
          </FormControl>
          {/* Display the uploaded image ID if available */}
          {form.watch("profilePhotoId") && (
            <p>
              Uploaded successfully!
              <a
                href={`/Image/${form.watch("profilePhotoId")}`}
                target="_blank"
                rel="noopener"
              >
                View image
              </a>
            </p>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
          <FormMessage />
        </FormItem>

        {/* Residence Fields */}
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="text-lg font-medium">Residence Information</h3>

          <FormField
            control={form.control}
            name="residence.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Country..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residence.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="City..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residence.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Street..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residence.streetNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Street number..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residence.apartmentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apartment Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Apartment number..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
