// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";

describe("SettingsView", () => {
  it("changes theme through the supplied command", () => {
    const onThemeModeChange = vi.fn();
    render(<SettingsView themeMode="system" onThemeModeChange={onThemeModeChange} trackingCycleStartDay={25} onTrackingCycleStartDayChange={vi.fn(async () => undefined)} accountEmail="owner@example.com" isDemo={false} onSignOut={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(onThemeModeChange).toHaveBeenCalledWith("dark");
    expect(screen.getByText("owner@example.com")).toBeTruthy();
  });

  it("does not expose sign-out in demo mode", () => {
    render(<SettingsView themeMode="light" onThemeModeChange={vi.fn()} trackingCycleStartDay={1} onTrackingCycleStartDayChange={vi.fn(async () => undefined)} isDemo onSignOut={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Sign Out" })).toBeNull();
  });

  it("persists a valid salary-aligned cycle day", () => {
    const onTrackingCycleStartDayChange = vi.fn(async () => undefined);
    render(<SettingsView themeMode="light" onThemeModeChange={vi.fn()} trackingCycleStartDay={1} onTrackingCycleStartDayChange={onTrackingCycleStartDayChange} isDemo onSignOut={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Tracking cycle start day"), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Save cycle" }));
    expect(onTrackingCycleStartDayChange).toHaveBeenCalledWith(25);
  });
});

afterEach(cleanup);
