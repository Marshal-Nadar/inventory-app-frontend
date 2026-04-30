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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sun, Moon, RotateCcw, Monitor } from "lucide-react";

// ─── Option Button ─────────────────────────────────────────────────

const OptionButton = ({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-md text-sm font-medium border transition-all",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background text-foreground border-border hover:bg-accent",
      className,
    )}
  >
    {children}
  </button>
);

// ─── Section ───────────────────────────────────────────────────────

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className='space-y-3'>
    <div>
      <p className='text-sm font-semibold text-foreground'>{title}</p>
      {description && (
        <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
      )}
    </div>
    <div className='flex flex-wrap gap-2'>{children}</div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);
  const user = useAppSelector((state) => state.auth.user);

  const canEdit = user?.role === "admin" || user?.role === "manager";

  return (
    <div className='space-y-6 max-w-2xl'>
      {/* Page header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>
            Appearance Settings
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Customize how the application looks and feels.
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
            Reset to Default
          </Button>
        )}
      </div>

      <Separator />

      {/* Read-only badge for non-admins */}
      {!canEdit && (
        <div className='flex items-center gap-2 p-3 rounded-md bg-muted text-muted-foreground text-sm'>
          <Monitor className='w-4 h-4 flex-shrink-0' />
          <span>
            Theme settings are managed by your admin. You are viewing read-only.
          </span>
        </div>
      )}

      {/* Color Mode */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Color Mode</CardTitle>
          <CardDescription>
            Switch between light and dark appearance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex gap-3'>
            <button
              disabled={!canEdit}
              onClick={() => dispatch(setColorMode("light"))}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all w-28",
                theme.colorMode === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground",
                !canEdit && "opacity-50 cursor-not-allowed",
              )}
            >
              <Sun className='w-5 h-5 text-foreground' />
              <span className='text-xs font-medium text-foreground'>Light</span>
              {theme.colorMode === "light" && (
                <Badge variant='secondary' className='text-xs'>
                  Active
                </Badge>
              )}
            </button>

            <button
              disabled={!canEdit}
              onClick={() => dispatch(setColorMode("dark"))}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all w-28",
                theme.colorMode === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground",
                !canEdit && "opacity-50 cursor-not-allowed",
              )}
            >
              <Moon className='w-5 h-5 text-foreground' />
              <span className='text-xs font-medium text-foreground'>Dark</span>
              {theme.colorMode === "dark" && (
                <Badge variant='secondary' className='text-xs'>
                  Active
                </Badge>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Preset */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Theme Preset</CardTitle>
          <CardDescription>
            Choose a color preset for the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Section title='Preset'>
            {(
              ["lake-view", "default", "sunset", "forest"] as ThemePreset[]
            ).map((p) => (
              <OptionButton
                key={p}
                active={theme.preset === p}
                onClick={() => canEdit && dispatch(setPreset(p))}
                className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
              >
                {p
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </OptionButton>
            ))}
          </Section>
        </CardContent>
      </Card>

      {/* Scale & Radius */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Scale & Radius</CardTitle>
          <CardDescription>
            Adjust UI density and corner rounding.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <Section
            title='Scale'
            description='Controls overall UI density and font size.'
          >
            {(["xs", "sm", "md", "lg"] as ThemeScale[]).map((s) => (
              <OptionButton
                key={s}
                active={theme.scale === s}
                onClick={() => canEdit && dispatch(setScale(s))}
                className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
              >
                {s.toUpperCase()}
              </OptionButton>
            ))}
          </Section>

          <Separator />

          <Section
            title='Radius'
            description='Controls corner rounding of UI elements.'
          >
            {(["sm", "md", "lg", "xl"] as ThemeRadius[]).map((r) => (
              <OptionButton
                key={r}
                active={theme.radius === r}
                onClick={() => canEdit && dispatch(setRadius(r))}
                className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
              >
                {r.toUpperCase()}
              </OptionButton>
            ))}
          </Section>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Layout</CardTitle>
          <CardDescription>
            Configure sidebar and content layout.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <Section
            title='Sidebar Mode'
            description='Default shows labels, Icon mode collapses to icons only.'
          >
            {(["default", "icon"] as SidebarMode[]).map((s) => (
              <OptionButton
                key={s}
                active={theme.sidebarMode === s}
                onClick={() => canEdit && dispatch(setSidebarMode(s))}
                className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </OptionButton>
            ))}
          </Section>

          <Separator />

          <Section
            title='Content Layout'
            description='Full uses all available width, Centered constrains to max width.'
          >
            {(["full", "centered"] as ContentLayout[]).map((l) => (
              <OptionButton
                key={l}
                active={theme.contentLayout === l}
                onClick={() => canEdit && dispatch(setContentLayout(l))}
                className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </OptionButton>
            ))}
          </Section>
        </CardContent>
      </Card>

      {/* Current config summary */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Current Configuration</CardTitle>
          <CardDescription>Active theme settings at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {Object.entries(theme).map(([key, value]) => (
              <div
                key={key}
                className='flex flex-col gap-1 p-3 rounded-md bg-muted'
              >
                <span className='text-xs text-muted-foreground capitalize'>
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className='text-sm font-medium text-foreground capitalize'>
                  {String(value).replace(/-/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
