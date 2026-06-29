import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AtSignIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { User } from "lucide-react";
import { DecorIcon } from "@/components/ui/decor-icon";
import { AuthDivider } from "@/components/ui/auth-divider";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Logo } from "@/components/shared/footer/logo";
import { XIcon } from "@/components/icons/x-icon";

export default function SignUp() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
      <div
        className={cn(
          "relative flex w-full max-w-sm flex-col justify-between p-6 md:p-8",
          "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
        )}
      >
        <div className="absolute -inset-y-6 -left-px w-px bg-border" />
        <div className="absolute -inset-y-6 -right-px w-px bg-border" />
        <div className="absolute -inset-x-6 -top-px h-px bg-border" />
        <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
        <DecorIcon position="top-left" />
        <DecorIcon position="bottom-right" />

        <div className="w-full max-w-sm animate-in space-y-8">
          <div className="flex flex-col text-center space-y-1">
            <Logo />
            <p className="text-base text-muted-foreground">
              Create your account & Get exclusive Discounts...
            </p>
          </div>
          <div className="space-y-4">
            <form className="space-y-2">

              {/* Input fields for Name */}
              <InputGroup>
                <InputGroupInput
                  placeholder="Enter your name"
                  type="name"
                />
                <InputGroupAddon align="inline-start">
                  <User />
                </InputGroupAddon>
              </InputGroup>

              {/* Input fields for email */}
              <InputGroup>
                <InputGroupInput
                  placeholder="email@example.com"
                  type="email"
                />
                <InputGroupAddon align="inline-start">
                  <AtSignIcon
                  />
                </InputGroupAddon>
              </InputGroup>

              {/* Input fields for password */}
              <InputGroup>
                <InputGroupInput
                  placeholder="Password"
                  type="password"
                />
                <InputGroupAddon align="inline-start">
                  <Lock />
                </InputGroupAddon>
              </InputGroup>

              <Button className="w-full" size="sm" type="button">
                Sign Up
              </Button>
            </form>

            {/* Divider */}
            <AuthDivider>OR</AuthDivider>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-2 space-y-2">
              <Button className="w-full" type="button" variant="outline">
                <GoogleIcon data-icon="inline-start" />

              </Button>
              <Button className="w-full" type="button" variant="outline">
                <XIcon data-icon="inline-start" />

              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            By clicking Sign Up, you agree to our{" "}
            <a
              className="underline underline-offset-4 hover:text-primary"
              href="#"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              className="underline underline-offset-4 hover:text-primary"
              href="#"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}





