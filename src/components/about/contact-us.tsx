import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import data from "../../../sitedata.json";
import { ContactForm } from "./contact-form";
import { AuthDivider } from "../ui/auth-divider";

const contactItems = data.about.contact.contactItems.map((item) => ({
    ...item,
    icon: item.icon === "Phone" ? <Phone className="text-primary" /> : <Mail className="text-primary" />,
}));

export function ContactSection() {
    return (
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-xl shadow-primary/10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold text-foreground">{data.about.contact.heading}</h1>
                        <p className="text-muted-foreground text-sm">
                            {data.about.contact.description}
                        </p>
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {contactItems.map((item) => (
                            <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-muted/50 p-4" key={item.title}>
                                <div className="text-primary">{item.icon}</div>
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="text-sm font-medium text-foreground">{item.title}</h2>
                                    <p className="text-xs text-muted-foreground">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md">
                    <AuthDivider className="md:hidden">OR</AuthDivider>
                    <div className="mb-8 space-y-2">
                        <h2 className="text-xl font-semibold text-foreground">{data.about.contact.formHeading}</h2>
                        <p className="text-muted-foreground text-sm">
                            {data.about.contact.formDescription}
                        </p>
                    </div>
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}
