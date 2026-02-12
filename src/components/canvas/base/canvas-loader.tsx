import { Progress } from '@/components/ui/progress';
import { FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CanvasLoader() {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    let secTimer: NodeJS.Timeout;
    const timer = setTimeout(() => {
      setProgress(40);
      secTimer = setTimeout(() => setProgress(75), 600);
    }, 1000);
    return () => {
      clearTimeout(timer);
      clearTimeout(secTimer);
    };
  }, []);

  return (
    <div className="bg-background fixed w-screen h-screen flex items-center justify-center text-primary transition-all">
      <div className="flex flex-col gap-6 items-center min-w-25">
        <FlaskConical className="size-15 animate-bounce" />
        <Progress value={progress} />
      </div>
    </div>
  );
}
