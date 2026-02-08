"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-24 w-24",
};

export default function Logo({ className, size = "md" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Sprinkle"
      width={48}
      height={48}
      className={cn("rounded-xl object-contain", sizeClasses[size], className)}
      priority
    />
  );
}
