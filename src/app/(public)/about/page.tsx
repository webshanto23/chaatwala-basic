"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Phone,
  Mail,
  MapPin
} from "lucide-react"

export default function AboutPage() {
  return (
    <main className="px-4 md:px-10 py-10 space-y-12 max-w-6xl mx-auto">

      {/* Header */}
      <section className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">
          About Chaatwala
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Bringing authentic street flavors to your doorstep with love and quality.
        </p>
      </section>

      {/* History */}
      <section>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">Our History</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chaatwala started as a small street-side stall with a passion for
              authentic Indian street food. Over time, we evolved into a modern
              food experience while preserving our traditional flavors.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Vision */}
      <section>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">Our Vision</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our vision is to become the go-to destination for street food lovers,
              combining taste, hygiene, and technology to deliver an unforgettable
              dining experience.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Owner's Take */}
      <section>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">Owner’s Take</h2>
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              “Food is not just about taste — it’s about emotion, memory, and
              experience. At Chaatwala, we serve happiness in every bite.”
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Contact + Map */}
      <section className="grid md:grid-cols-2 gap-6">

        {/* Map */}
        <Card className="rounded-2xl overflow-hidden">
          <iframe
            src="https://www.google.com/maps?q=Dhaka&output=embed"
            className="w-full h-[300px] border-0 px-2 rounded-md"
            loading="lazy"
          />
        </Card>

        {/* Contact Info */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-5">

            <h2 className="text-xl font-semibold">Contact Us</h2>

            {/* Phone */}
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-5 h-5 text-primary" />
              <span>+880 1234-567890</span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-primary" />
              <span>support@chaatwala.com</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Dhaka, Bangladesh</span>
            </div>

            {/* Socials */}
            <div className="flex gap-4 pt-3">
              <Mail className="w-5 h-5 cursor-pointer hover:text-primary" />
              <Mail className="w-5 h-5 cursor-pointer hover:text-primary" />
              <Mail className="w-5 h-5 cursor-pointer hover:text-primary" />
            </div>

          </CardContent>
        </Card>

      </section>
    </main>
  )
}