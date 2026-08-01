import { ContactsWorkspace } from "@/components/contacts-workspace";
import { getContacts, getFormOptions } from "@/lib/queries";

export default async function ContactsPage() {
  const [contacts, { cities }] = await Promise.all([
    getContacts(),
    getFormOptions(),
  ]);

  return <ContactsWorkspace contacts={contacts.map((contact) => ({
    ...contact,
    lastInteractionAt: contact.lastInteractionAt?.toISOString() ?? null,
  }))} cities={cities} />;
}
