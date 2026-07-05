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
        <div className="flex flex-col gap-6 md:flex-row items-center justify-evenly border border-border rounded-2xl bg-card p-6 shadow-sm">
            {/* top */}
            <div>
                <div className="mb-2 flex flex-col gap-2">
                    <h1 className="font-bold text-xl md:text-2xl text-foreground">{data.about.contact.heading}</h1>{" "}
                    <p className="text-muted-foreground text-sm">
                        {data.about.contact.description}
                    </p>
                </div>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 max-w-md">
                    {contactItems.map((item) => (
                        <div className="flex items-center gap-4 p-2" key={item.title}>
                            <div className="[&_svg]:size-5 [&_svg]:text-primary">
                                {item.icon}
                            </div>
                            <div className={cn("flex flex-col gap-y-0.5")}>
                                <h2 className="text-sm font-medium text-foreground">{item.title}</h2>
                                <p className="text-muted-foreground text-xs">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* form */}
            <div className="w-full max-w-md">
                <AuthDivider className="md:hidden">OR</AuthDivider>
                <div className="mb-8 flex flex-col gap-1.5">
                    <h2 className="font-semibold text-xl text-foreground">{data.about.contact.formHeading}</h2>{" "}
                    <p className="text-muted-foreground text-sm">
                        {data.about.contact.formDescription}
                    </p>
                </div>
                <ContactForm />
            </div>

        </div>
    );
}




