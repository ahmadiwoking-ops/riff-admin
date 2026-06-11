import './globals.css';
export const metadata = { title: 'Riff Admin', description: 'Management dashboard' };
export default function Layout({ children }) {
  return <html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" /></head><body>{children}</body></html>;
}
