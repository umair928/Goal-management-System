"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ProfileInput = {
  preferredName: string;
  pronouns: string;
  location: string;
  phone: string;
  about: string;
  skills: string;
};

export async function updateProfile(input: ProfileInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferredName: input.preferredName.trim() || null,
      pronouns: input.pronouns.trim() || null,
      location: input.location.trim() || null,
      phone: input.phone.trim() || null,
      about: input.about.trim() || null,
      skills: input.skills.trim() || null,
    },
  });

  revalidatePath("/profile");
}
