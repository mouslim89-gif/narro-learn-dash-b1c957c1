import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReadingProgressStore, type FontSize } from '@/stores/reading-progress';
import { Button } from '@/components/ui/button';

const fontSizeOptions: { label: string; value: FontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

export default function Settings() {
  const { darkMode, setDarkMode, fontSize, setFontSize, showFurigana, setShowFurigana } =
    useReadingProgressStore();

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={-1 as any} onClick={(e) => { e.preventDefault(); window.history.back(); }}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Section: Appearance */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Appearance
          </h2>

          <div className="space-y-5">
            {/* Dark mode */}
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-base font-medium">Dark mode</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            {/* Font size */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Default font size</Label>
              <div className="flex gap-1">
                {fontSizeOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={fontSize === opt.value ? 'default' : 'outline'}
                    size="sm"
                    className="w-10 h-8 text-sm font-semibold"
                    onClick={() => setFontSize(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Furigana */}
            <div className="flex items-center justify-between">
              <Label htmlFor="furigana" className="text-base font-medium">Show furigana</Label>
              <Switch
                id="furigana"
                checked={showFurigana}
                onCheckedChange={setShowFurigana}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
