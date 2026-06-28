import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import { ContactForm } from "./contact-form";
import { AuthDivider } from "../ui/auth-divider";


const data = [
    {
        title: "Call Us Today!",
        value: "+1 (555) 123-4567",
        icon: (
            <Phone
            />
        ),
    },
    {
        title: "Send an Email",
        value: "mail@example.com",
        icon: (
            <Mail
            />
        ),
    },
];

export function ContactSection() {
    return (
        <div className="flex flex-col gap-6 md:flex-row items-center justify-evenly border rounded-2xl shadow-sm px-6 py-6">
            {/* top */}
            <div>
                <div className="mb-2 flex flex-col gap-2">
                    <h1 className="font-semibold text-xl md:text-2xl">Get in touch</h1>{" "}
                    <p className="text-muted-foreground text-sm">
                        Have a question, feedback, or want to collaborate? <br /> We'd love
                        to hear from you.
                    </p>
                </div>
                <div className="grid gap-2 grid-cols-2">
                    {data.map((item) => (
                        <div className="flex items-center gap-4 p-2" key={item.title}>
                            <div className="[&_svg]:size-5 [&_svg]:text-muted-foreground">
                                {item.icon}
                            </div>
                            <div className={cn("flex flex-col gap-y-0.5")}>
                                <h2 className="text-sm">{item.title}</h2>
                                <p className="text-muted-foreground text-xs">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* form */}
            <div>
                <AuthDivider className="md:hidden">OR</AuthDivider>
                <div className="mb-8 flex flex-col gap-1.5">
                    <h2 className="font-medium text-xl">Send a message</h2>{" "}
                    <p className="text-muted-foreground text-sm">
                        Fill out the form below and our team will get back to you shortly.
                    </p>
                </div>
                <ContactForm />
            </div>

        </div>
    );
}




