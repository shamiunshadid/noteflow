"use client";

import React from "react";
import { useNoteFlowStore } from "@/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { Key, Palette, Type, Monitor, Moon, Sun } from "lucide-react";

export const SettingsDialog: React.FC = () => {
  const { settings, updateSettings, showSettings, setShowSettings } =
    useNoteFlowStore();
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your NoteFlow preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              GLM API Key
            </Label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder="Enter your GLM API key"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://open.bigmodel.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                open.bigmodel.cn
              </a>
            </p>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size: {settings.fontSize}px
            </Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSettings({ fontSize: value })}
              min={12}
              max={24}
              step={1}
            />
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label>Line Height: {settings.lineHeigh}</Label>
            <Slider
              value={[settings.lineHeigh * 10]}
              onValueChange={([value]) =>
                updateSettings({ lineHeigh: value / 10 })
              }
              min={12}
              max={24}
              step={1}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};