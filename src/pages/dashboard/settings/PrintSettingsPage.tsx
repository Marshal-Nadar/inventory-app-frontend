import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Printer,
  Building2,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import {
  printSettingsService,
  type PrintSettings,
} from "@/services/printSettingsService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setPrintSettings } from "@/store/slices/authSlice";

export const PrintSettingsPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const restaurantId = user?.restaurant_id;

  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [footerNote, setFooterNote] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    printSettingsService
      .get(restaurantId)
      .then((data) => {
        setSettings(data);
        setCompanyName(data.print_company_name || "");
        setAddress(data.print_address || "");
        setContact(data.print_contact || "");
        setFooterNote(data.print_footer_note || "");
      })
      .catch(() => toast.error("Failed to load print settings"))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      const updated = await printSettingsService.update(restaurantId, {
        print_company_name: companyName,
        print_address: address,
        print_contact: contact,
        print_footer_note: footerNote,
      });
      dispatch(setPrintSettings(updated)); // ← update Redux instantly
      toast.success("Print settings saved");
    } catch {
      toast.error("Failed to save print settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Loading print settings...
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Print Settings</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Configure header and footer for all printed documents.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base flex items-center gap-2'>
            <Printer className='w-4 h-4' />
            Header Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Building2 className='w-3.5 h-3.5 text-muted-foreground' />
              Company Name
            </Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={settings?.name || "Enter company name"}
            />
            <p className='text-xs text-muted-foreground'>
              Leave blank to use restaurant name: "{settings?.name}"
            </p>
          </div>

          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <MapPin className='w-3.5 h-3.5 text-muted-foreground' />
              Address
            </Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='Enter full address'
              rows={3}
            />
          </div>

          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Phone className='w-3.5 h-3.5 text-muted-foreground' />
              Contact Number
            </Label>
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder='e.g. +91 98765 43210'
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base flex items-center gap-2'>
            <FileText className='w-4 h-4' />
            Footer Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>Footer Note</Label>
            <Input
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder='e.g. Thank you for your business'
            />
            <p className='text-xs text-muted-foreground'>
              Appears between the footer note and signatures.
            </p>
          </div>

          <Separator />

          {/* Signature preview */}
          <div>
            <p className='text-xs text-muted-foreground font-medium mb-3'>
              Signature Lines Preview
            </p>
            <div className='flex justify-between gap-8 px-4 py-6 border rounded-lg bg-muted/30'>
              <div className='flex flex-col items-center gap-2 flex-1'>
                <div className='w-full border-b border-foreground/40 pb-1' />
                <p className='text-xs text-muted-foreground'>
                  Authorized Signature
                </p>
              </div>
              <div className='flex flex-col items-center gap-2 flex-1'>
                <div className='w-full border-b border-foreground/40 pb-1' />
                <p className='text-xs text-muted-foreground'>
                  Receiver's Signature
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='border rounded-lg overflow-hidden text-sm'>
            {/* Header preview */}
            <div className='bg-muted/30 px-6 py-4 border-b'>
              <div className='flex justify-between items-start'>
                <div className='space-y-0.5'>
                  <p className='font-bold text-base text-foreground'>
                    {companyName || settings?.name || "Company Name"}
                  </p>
                  {address && (
                    <p className='text-xs text-muted-foreground whitespace-pre-line'>
                      {address}
                    </p>
                  )}
                  {contact && (
                    <p className='text-xs text-muted-foreground'>
                      📞 {contact}
                    </p>
                  )}
                </div>
                <div className='text-right text-xs text-muted-foreground'>
                  <p className='font-medium'>
                    {new Date().toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p>
                    {new Date().toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Content placeholder */}
            <div className='px-6 py-4 space-y-1'>
              <div className='h-3 bg-muted rounded w-full' />
              <div className='h-3 bg-muted rounded w-4/5' />
              <div className='h-3 bg-muted rounded w-3/5' />
            </div>

            {/* Footer preview */}
            <div className='bg-muted/30 px-6 py-4 border-t space-y-3'>
              {footerNote && (
                <p className='text-xs text-center text-muted-foreground'>
                  {footerNote}
                </p>
              )}
              <div className='flex justify-between gap-8 pt-2'>
                <div className='flex flex-col items-center gap-1 flex-1'>
                  <div className='w-full border-b border-foreground/40' />
                  <p className='text-xs text-muted-foreground'>
                    Authorized Signature
                  </p>
                </div>
                <div className='flex flex-col items-center gap-1 flex-1'>
                  <div className='w-full border-b border-foreground/40' />
                  <p className='text-xs text-muted-foreground'>
                    Receiver's Signature
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='pb-8'>
        <Button onClick={handleSave} disabled={saving} className='gap-2'>
          <Save className='w-4 h-4' />
          {saving ? "Saving..." : "Save Print Settings"}
        </Button>
      </div>
    </div>
  );
};
