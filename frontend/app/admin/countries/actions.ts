"use server";

import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSessionOrNull } from "@/lib/session";

const CountrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  iso_code: z.string().length(2, "ISO Code must be 2 characters").toUpperCase(),
  continent: z.string().optional(),
  description: z.string().optional(),
});

export async function saveCountry(countryId: string | "new", formData: FormData) {
  const session = await getAdminSessionOrNull();
  if (!session) return { error: "Unauthorized." };

  const supabase = createAdminClient();

  const rawData = {
    name: formData.get("name") as string,
    iso_code: formData.get("iso_code") as string,
    continent: formData.get("continent") as string,
    description: formData.get("description") as string,
  };

  const validated = CountrySchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { data } = validated;

  if (countryId === "new") {
    const { error } = await supabase.from("countries").insert(data);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("countries")
      .update(data)
      .eq("country_id", parseInt(countryId, 10));
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/countries");
  redirect("/admin/countries");
}
