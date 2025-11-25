import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Theme = "light" | "dark" | "system";

const Settings = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background pb-20 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your app preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose how Fair Play looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <Sun className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Light</div>
                    <div className="text-sm text-muted-foreground">Clean and bright</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <Moon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">Dark</div>
                    <div className="text-sm text-muted-foreground">Easy on the eyes</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">System</div>
                    <div className="text-sm text-muted-foreground">Match device settings</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
