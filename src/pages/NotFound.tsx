import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Radio className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-6xl font-black text-gradient-brand mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Page not found</p>
        <Link to="/">
          <Button className="bg-gradient-brand hover:opacity-90">Return Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
