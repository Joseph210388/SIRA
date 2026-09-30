import { asBuffer, decryptString } from "@/lib/crypto";
import { assumeUser, withDatabase } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type OwnProfile = {
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  locality: string;
  birthDate: string;
};

export async function loadOwnProfile(userId: string): Promise<OwnProfile | null> {
  return withDatabase(async (db, client) => {
    await assumeUser(client, userId);
    const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (!person || !profile) return null;
    return {
      email: person.email,
      displayName: profile.displayName,
      firstName: decryptString(asBuffer(person.firstNameCiphertext)),
      lastName: decryptString(asBuffer(person.lastNameCiphertext)),
      phone: decryptString(asBuffer(person.phoneCiphertext)),
      city: decryptString(asBuffer(person.cityCiphertext)),
      locality: decryptString(asBuffer(person.localityCiphertext)),
      birthDate: decryptString(asBuffer(person.birthDateCiphertext)),
    };
  });
}
