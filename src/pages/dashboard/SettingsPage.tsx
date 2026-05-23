import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  setColorMode,
  setPreset,
  setScale,
  setRadius,
  setSidebarMode,
  setContentLayout,
  resetTheme,
  type ColorMode,
  type ThemePreset,
  type ThemeScale,
  type ThemeRadius,
  type SidebarMode,
  type ContentLayout,
} from "@/store/slices/themeSlice";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  RotateCcw,
  Monitor,
  Check,
  Palette,
  Layout,
  Type,
  Columns,
} from "lucide-react";

// ─── Preset color dots ─────────────────────────────────────────────

const PRESET_COLORS: Record<string, string> = {
  "lake-view": "bg-[oklch(0.6_0.18_220)]",
  default: "bg-[oklch(0.205_0_0)]",
  sunset: "bg-[oklch(0.5588_0.1879_25.42)]",
  forest: "bg-[oklch(0.531979_0.095562_181.5405)]",
  "ocean-breeze": "bg-[oklch(0.5461_0.2152_262.88)]",
};

const PRESET_LABELS: Record<string, string> = {
  "lake-view": "Lake View",
  default: "Default",
  sunset: "Sunset",
  forest: "Forest",
  "ocean-breeze": "Ocean Breeze",
};

// ─── Section Card ──────────────────────────────────────────────────

const SectionCard = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className='rounded-xl border border-border bg-card p-5 space-y-4'>
    <div className='flex items-start gap-3'>
      <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0'>
        <Icon className='w-4 h-4 text-primary' />
      </div>
      <div>
        <p className='text-sm font-semibold text-foreground'>{title}</p>
        <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
      </div>
    </div>
    {children}
  </div>
);

// ─── Pill Button ───────────────────────────────────────────────────

const PillButton = ({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-sm"
        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
      disabled && "opacity-40 cursor-not-allowed pointer-events-none",
    )}
  >
    {children}
  </button>
);

// ─── Main Page ─────────────────────────────────────────────────────

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);
  const user = useAppSelector((state) => state.auth.user);

  const canEdit =
    user?.role === "admin" || user?.role === "manager" || user?.is_super_admin;

  return (
    <div className='space-y-6 max-w-5xl'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>Appearance</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Customize how the app looks and feels.
          </p>
        </div>
        {canEdit && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => dispatch(resetTheme())}
            className='gap-2'
          >
            <RotateCcw className='w-3.5 h-3.5' />
            Reset
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className='flex items-center gap-2 px-4 py-3 rounded-lg bg-muted text-muted-foreground text-sm border border-border'>
          <Monitor className='w-4 h-4 flex-shrink-0' />
          Theme settings are managed by your admin.
        </div>
      )}

      {/* Top two columns */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Color Mode */}
        <SectionCard
          icon={Sun}
          title='Color Mode'
          description='Switch between light and dark appearance.'
        >
          <div className='flex gap-3'>
            {(["light", "dark"] as ColorMode[]).map((mode) => (
              <button
                key={mode}
                disabled={!canEdit}
                onClick={() => dispatch(setColorMode(mode))}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                  theme.colorMode === mode
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                  !canEdit && "opacity-40 cursor-not-allowed",
                )}
              >
                {mode === "light" ? (
                  <Sun className='w-5 h-5 text-foreground' />
                ) : (
                  <Moon className='w-5 h-5 text-foreground' />
                )}
                <span className='text-xs font-semibold text-foreground capitalize'>
                  {mode}
                </span>
                {theme.colorMode === mode && (
                  <div className='w-4 h-4 rounded-full bg-primary flex items-center justify-center'>
                    <Check className='w-2.5 h-2.5 text-primary-foreground' />
                  </div>
                )}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Theme Preset */}
        <SectionCard
          icon={Palette}
          title='Theme Preset'
          description='Choose a color preset for the interface.'
        >
          <div className='grid grid-cols-5 gap-2'>
            {(Object.keys(PRESET_COLORS) as ThemePreset[]).map((p) => (
              <button
                key={p}
                disabled={!canEdit}
                onClick={() => canEdit && dispatch(setPreset(p))}
                title={PRESET_LABELS[p]}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all",
                  theme.preset === p
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                  !canEdit && "opacity-40 cursor-not-allowed",
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex-shrink-0",
                    PRESET_COLORS[p],
                  )}
                />
                {theme.preset === p && (
                  <Check className='w-3 h-3 text-primary' />
                )}
                {theme.preset !== p && <span className='h-3' />}
              </button>
            ))}
          </div>
          <p className='text-xs text-muted-foreground'>
            Selected:{" "}
            <span className='font-medium text-foreground'>
              {PRESET_LABELS[theme.preset]}
            </span>
          </p>
        </SectionCard>
      </div>

      {/* Middle two columns */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Scale & Radius */}
        <SectionCard
          icon={Type}
          title='Scale & Radius'
          description='Adjust UI density and corner rounding.'
        >
          <div className='space-y-4'>
            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground font-medium'>Scale</p>
              <div className='flex gap-2 flex-wrap'>
                {(["xs", "sm", "md", "lg"] as ThemeScale[]).map((s) => (
                  <PillButton
                    key={s}
                    active={theme.scale === s}
                    onClick={() => canEdit && dispatch(setScale(s))}
                    disabled={!canEdit}
                  >
                    {s.toUpperCase()}
                  </PillButton>
                ))}
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground font-medium'>
                Radius
              </p>
              <div className='flex gap-2 flex-wrap'>
                {(["sm", "md", "lg", "xl"] as ThemeRadius[]).map((r) => (
                  <PillButton
                    key={r}
                    active={theme.radius === r}
                    onClick={() => canEdit && dispatch(setRadius(r))}
                    disabled={!canEdit}
                  >
                    {r.toUpperCase()}
                  </PillButton>
                ))}
              </div>
              {/* radius preview */}
              <div className='flex gap-2 pt-1'>
                {(["sm", "md", "lg", "xl"] as ThemeRadius[]).map((r) => (
                  <div
                    key={r}
                    className={cn(
                      "w-8 h-8 border-2 border-primary/40 bg-primary/10 transition-all",
                      r === "sm" && "rounded-sm",
                      r === "md" && "rounded-md",
                      r === "lg" && "rounded-lg",
                      r === "xl" && "rounded-xl",
                      theme.radius === r && "border-primary bg-primary/20",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Layout */}
        <SectionCard
          icon={Layout}
          title='Layout'
          description='Configure sidebar and content layout.'
        >
          <div className='space-y-4'>
            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground font-medium'>
                Sidebar Mode
              </p>
              <div className='flex gap-2'>
                {(["default", "icon"] as SidebarMode[]).map((s) => (
                  <PillButton
                    key={s}
                    active={theme.sidebarMode === s}
                    onClick={() => canEdit && dispatch(setSidebarMode(s))}
                    disabled={!canEdit}
                  >
                    {s === "default" ? "Default" : "Icon Only"}
                  </PillButton>
                ))}
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground font-medium'>
                Content Layout
              </p>
              <div className='flex gap-2'>
                {(["full", "centered"] as ContentLayout[]).map((l) => (
                  <PillButton
                    key={l}
                    active={theme.contentLayout === l}
                    onClick={() => canEdit && dispatch(setContentLayout(l))}
                    disabled={!canEdit}
                  >
                    {l === "full" ? "Full Width" : "Centered"}
                  </PillButton>
                ))}
              </div>
              {/* layout preview */}
              <div className='flex gap-3 pt-1'>
                {(["full", "centered"] as ContentLayout[]).map((l) => (
                  <div
                    key={l}
                    className={cn(
                      "flex-1 h-10 rounded-md border-2 transition-all flex items-center p-1 gap-0.5",
                      theme.contentLayout === l
                        ? "border-primary"
                        : "border-border",
                    )}
                  >
                    {l === "full" ? (
                      <div className='w-full h-full rounded bg-primary/20' />
                    ) : (
                      <>
                        <div className='w-1/6 h-full rounded bg-muted' />
                        <div className='flex-1 h-full rounded bg-primary/20' />
                        <div className='w-1/6 h-full rounded bg-muted' />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Current Config — full width */}
      <div className='rounded-xl border border-border bg-card p-5 space-y-4'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
            <Columns className='w-4 h-4 text-primary' />
          </div>
          <div>
            <p className='text-sm font-semibold text-foreground'>
              Current Configuration
            </p>
            <p className='text-xs text-muted-foreground'>
              Active theme settings at a glance.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3'>
          {Object.entries(theme).map(([key, value]) => (
            <div
              key={key}
              className='flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-muted/60 border border-border'
            >
              <span className='text-xs text-muted-foreground capitalize leading-none'>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className='text-sm font-semibold text-foreground capitalize truncate'>
                {String(value).replace(/-/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
