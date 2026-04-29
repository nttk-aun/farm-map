import './globals.css';
import AuthSessionProvider from '@/components/AuthSessionProvider';

export const metadata = {
  title: 'Thailand Farm Map',
  description: 'แผนที่ฟาร์มสัตว์ในประเทศไทย',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0 }}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
