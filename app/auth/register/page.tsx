"use client";

import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RegisterForm from "@/components/auth/register-form";
import OAuthButton from "@/components/wrappers/auth-button-wrapper";
import GoogleIcon from "@/components/svg/google-svg";
import GithubIcon from "@/components/svg/github-svg";
import { click } from "@/utils/oauth-login-function";

export default function Login() {
  const searchParams = useSearchParams();

  const error =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already linked with another provider."
      : null;

  return (
    <main className="flex flex-row w-full h-[100lvh]">
      <section className="flex-1 relative flex items-center justify-center xs:w-[100%] bg-[#191919] custom-padding">
        <div className="absolute md:top-10 md:left-12 top-2 left-4">
          <Button
            onClick={() => (window.location.href = "/auth/login")}
            variant="outline"
          >
            <MoveLeft className="text-black" />
            <span className="text-black text-sm">Login</span>
          </Button>
        </div>

        <div className="flex flex-col max-w-[350px] gap-4 w-full">
          <div className="flex flex-col">
            <h3 className="text-[#ffffff] text-[24px] font-[400]">
              Create an account
            </h3>
            <p className="text-[#bfbfbf] text-[16px]">Connect with:</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-4">
              <OAuthButton onClick={() => click("google")}>
                <GoogleIcon />
                <span className="text-[#141414] text-[14px]">Google</span>
              </OAuthButton>

              <OAuthButton onClick={() => click("github")}>
                <GithubIcon />
                <span className="text-[#141414] text-[14px]">GitHub</span>
              </OAuthButton>
            </div>
          </div>

          <div className="flex items-center justify-center gap-x-4">
            <div className="border-[#bfbfbf] border-1 w-[74px]" />
            <span className="text-[#bfbfbf] text-[12px]">
              OR SIGNUP WITH YOUR EMAIL
            </span>
            <div className="border-[#bfbfbf] border-1 w-[74px]" />
          </div>

          <RegisterForm />

          <p className="text-xs text-[#939393]">
            By creating an account you agree to the{" "}
            <span className="underline">Terms of Service</span> and our{" "}
            <span className="underline">Privacy Policy</span>.
          </p>

          <h6 className="text-white">
            Already have an account?{" "}
            <span className="text-blue-500 font-semibold">
              <Link href="/auth/login">Log In</Link>
            </span>
          </h6>
        </div>
      </section>
    </main>
  );
}
