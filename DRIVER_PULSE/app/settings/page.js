"use client";

// Settings page:
// Stores goals/notifications/appearance/account in localStorage.
// Dashboard reads goals to compute progress targets.

import { useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageContext";
import LanguageDropdown from "../../components/LanguageDropdown";
import Card from "../../components/Card";
import CardGrid from "../../components/CardGrid";
import ToggleSwitch from "../../components/ToggleSwitch";
import Button from "../../components/Button";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [goals, setGoals] = useState({ targetEarnings: 400, targetTrips: 18 });
  const [notifications, setNotifications] = useState({
    trip: true,
    safety: true,
    earnings: true,
    daily: true,
  });
  const [appearance, setAppearance] = useState("system");
  const [account, setAccount] = useState({ name: "Alex", vehicle: "Toyota Prius • Blue" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = window.localStorage.getItem("driver_pulse_goals");
    const n = window.localStorage.getItem("driver_pulse_notifications");
    const a = window.localStorage.getItem("driver_pulse_appearance");
    const acc = window.localStorage.getItem("driver_pulse_account");

    if (g) {
      try {
        const parsed = JSON.parse(g);
        setGoals({
          targetEarnings: Number(parsed?.targetEarnings) || 400,
          targetTrips: Number(parsed?.targetTrips) || 18,
        });
      } catch {}
    }
    if (n) {
      try {
        const parsed = JSON.parse(n);
        setNotifications({
          trip: !!parsed?.trip,
          safety: !!parsed?.safety,
          earnings: !!parsed?.earnings,
          daily: !!parsed?.daily,
        });
      } catch {}
    }
    if (a) setAppearance(a);
    if (acc) {
      try {
        const parsed = JSON.parse(acc);
        setAccount({
          name: parsed?.name || "Alex",
          vehicle: parsed?.vehicle || "Toyota Prius • Blue",
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("driver_pulse_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("driver_pulse_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("driver_pulse_appearance", appearance);
  }, [appearance]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("driver_pulse_account", JSON.stringify(account));
  }, [account]);

  return (
    <div className="page-section">
      <div className="row between wrap gap-3">
        <div className="col">
          <div className="page-title">{t("settings")}</div>
          <div className="muted">Preferences that shape your dashboard</div>
        </div>
      </div>

      <div className="mt-4">
        <CardGrid cols={2}>
          <Card title={t("language")} subtitle={t("preferredLanguage")}>
            <LanguageDropdown variant="full" />
            <div className="muted mt-3" style={{ fontSize: 13 }}>
              Language is saved locally and persists after refresh.
            </div>
          </Card>

          <Card title="Appearance" subtitle="Light / Dark / System">
            <div className="col gap-3">
              {["light", "dark", "system"].map((mode) => (
                <label key={mode} className="row gap-2" style={{ fontWeight: 800 }}>
                  <input
                    type="radio"
                    name="appearance"
                    value={mode}
                    checked={appearance === mode}
                    onChange={(e) => setAppearance(e.target.value)}
                  />
                  {mode[0].toUpperCase() + mode.slice(1)}
                </label>
              ))}
              <div className="muted" style={{ fontSize: 13 }}>
                (UI uses a clean light dashboard + dark sidebar by default.)
              </div>
            </div>
          </Card>
        </CardGrid>
      </div>

      <div className="mt-4">
        <CardGrid cols={2}>
          <Card title="Driver Goals" subtitle="Used for daily progress + targets">
            <div className="col gap-3">
              <label className="col gap-2" style={{ fontWeight: 800 }}>
                Daily earnings target
                <input
                  className="ui-input"
                  type="number"
                  min={0}
                  value={goals.targetEarnings}
                  onChange={(e) => setGoals((g) => ({ ...g, targetEarnings: Number(e.target.value) }))}
                  aria-label="Daily earnings target"
                />
              </label>
              <label className="col gap-2" style={{ fontWeight: 800 }}>
                Trips target
                <input
                  className="ui-input"
                  type="number"
                  min={1}
                  value={goals.targetTrips}
                  onChange={(e) => setGoals((g) => ({ ...g, targetTrips: Number(e.target.value) }))}
                  aria-label="Trips target"
                />
              </label>
              <div className="muted" style={{ fontSize: 13 }}>
                Stored in localStorage and applied on Dashboard immediately.
              </div>
            </div>
          </Card>

          <Card title="Notifications" subtitle="Choose which alerts you see">
            <ToggleSwitch
              id="notif-trip"
              label="Trip alerts"
              checked={notifications.trip}
              onChange={(v) => setNotifications((n) => ({ ...n, trip: v }))}
            />
            <ToggleSwitch
              id="notif-safety"
              label="Safety alerts"
              checked={notifications.safety}
              onChange={(v) => setNotifications((n) => ({ ...n, safety: v }))}
            />
            <ToggleSwitch
              id="notif-earnings"
              label="Earnings alerts"
              checked={notifications.earnings}
              onChange={(v) => setNotifications((n) => ({ ...n, earnings: v }))}
            />
            <ToggleSwitch
              id="notif-daily"
              label="Daily summary"
              checked={notifications.daily}
              onChange={(v) => setNotifications((n) => ({ ...n, daily: v }))}
            />
          </Card>
        </CardGrid>
      </div>

      <div className="mt-4">
        <Card title="Account" subtitle="Driver profile and vehicle info">
          <div className="row between wrap gap-3">
            <div className="col">
              <div className="muted" style={{ fontSize: 12 }}>Driver name</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{account.name}</div>
              <div className="muted mt-2" style={{ fontSize: 12 }}>Vehicle</div>
              <div style={{ fontWeight: 800 }}>{account.vehicle}</div>
            </div>
            <Button
              variant="secondary"
              size="md"
              ariaLabel="Edit account"
              onClick={() => {
                const next = account.name === "Alex" ? "Jordan" : "Alex";
                setAccount((a) => ({ ...a, name: next }));
              }}
            >
              Edit
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

