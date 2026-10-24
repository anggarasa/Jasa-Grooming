// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import RootLayout, { metadata } from "@/app/layout";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({ variable: "--font-plus-jakarta-sans" }),
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("RootLayout (src/app/layout.tsx)", () => {
  it("menyediakan metadata dasar yang valid", () => {
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });

  it("merender html dan body dengan suppressHydrationWarning untuk mencegah extension mismatch", () => {
    const element = RootLayout({
      children: <div data-testid="child-content">Test Child</div>,
    });

    expect(element.type).toBe("html");
    expect(element.props.suppressHydrationWarning).toBe(true);

    const bodyElement = element.props.children;
    expect(bodyElement.type).toBe("body");
    expect(bodyElement.props.suppressHydrationWarning).toBe(true);
    expect(bodyElement.props.className).toContain("min-h-full");
    expect(bodyElement.props.className).toContain("bg-background");
  });
});
