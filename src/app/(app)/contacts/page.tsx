import { ContactForm } from "@/components/forms";
import { ContactCard } from "@/components/contact-card";
import { SectionHeader } from "@/components/ui-shell";
import { getContacts, getFormOptions } from "@/lib/queries";

export default async function ContactsPage() {
  const [contacts, { cities }] = await Promise.all([
    getContacts(),
    getFormOptions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeader
        title="人脉馆"
        description="记录关键联系人、最近互动和关联待办。"
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h3 className="text-base font-medium text-stone-900">添加人脉</h3>
          <div className="mt-4">
            <ContactForm cities={cities} />
          </div>
        </section>

        <section className="space-y-3">
          {contacts.length ? (
            contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} cities={cities} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center text-sm text-stone-500">
              还没有人脉记录。先添加一个关键联系人吧。
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
