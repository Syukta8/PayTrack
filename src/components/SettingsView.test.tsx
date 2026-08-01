// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";

describe("SettingsView", () => {
  it("changes theme through the supplied command", () => {
    const onThemeModeChange = vi.fn();
    render(<SettingsView themeMode="system" onThemeModeChange={onThemeModeChange} accountEmail="owner@example.com" isDemo={false} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(onThemeModeChange).toHaveBeenCalledWith("dark");
    expect(screen.getByText("owner@example.com")).toBeTruthy();
  });

  it("does not expose sign-out in demo mode", () => {
    render(<SettingsView themeMode="light" onThemeModeChange={vi.fn()} isDemo onSignOut={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Sign Out" })).toBeNull();
  });
});

afterEach(cleanup);
