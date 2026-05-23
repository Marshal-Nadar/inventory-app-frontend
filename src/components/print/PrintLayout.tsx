import { type PrintSettings } from "@/services/printSettingsService";
import { format } from "date-fns";

interface Props {
  settings: PrintSettings;
  title: string;
  children: React.ReactNode;
}

export const PrintLayout = ({ settings, title, children }: Props) => {
  return (
    <div className='print-layout'>
      {/* Header */}
      <div className='print-header'>
        <div className='print-header-left'>
          <h1 className='print-company-name'>
            {settings.print_company_name || settings.name}
          </h1>
          {settings.print_address && (
            <p className='print-address'>{settings.print_address}</p>
          )}
          {settings.print_contact && (
            <p className='print-contact'>📞 {settings.print_contact}</p>
          )}
        </div>
        <div className='print-header-right'>
          <p className='print-title'>{title}</p>
          <p className='print-datetime'>
            {format(new Date(), "dd MMM yyyy, hh:mm a")}
          </p>
        </div>
      </div>

      <div className='print-divider' />

      {/* Content */}
      <div className='print-content'>{children}</div>

      <div className='print-divider' />

      {/* Footer */}
      <div className='print-footer'>
        {settings.print_footer_note && (
          <p className='print-footer-note'>{settings.print_footer_note}</p>
        )}
        <div className='print-signatures'>
          <div className='print-signature-box'>
            <div className='print-signature-line' />
            <p>Authorized Signature</p>
          </div>
          <div className='print-signature-box'>
            <div className='print-signature-line' />
            <p>Receiver's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
