"use client";

import React, { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  FileAudio,
  Sparkles,
  ArrowRight,
  Check,
  Key,
} from "lucide-react";

export const WelcomeModal: React.FC = () => {
  const { showWelcome, setShowWelcome, settings, updateSettings } =
    useNoteFlowStore();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(settings.apiKey);

  const features = [
    {
      icon: FileText,
      title: "Knowledge Base Management",
      description:
        "Create, organize, and manage your notes with a powerful tree structure. Drag and drop to reorganize.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: FileAudio,
      title: "AI Meeting Minutes",
      description:
        "Upload audio files to automatically generate meeting minutes with key points and action items.",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Sparkles,
      title: "Intelligent Content Editing",
      description:
        "Use AI to polish, expand, condense, or translate your content with natural language commands.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  const handleComplete = () => {
    if (apiKey) {
      updateSettings({ apiKey });
    }
    setShowWelcome(false);
  };

  return (
    <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 0 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to NoteFlow</DialogTitle>
              <DialogDescription>
                Your personal knowledge base with AI-powered capabilities
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center shrink-0`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(1)}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configure API Key
              </DialogTitle>
              <DialogDescription>
                Set up your GLM API key to enable AI features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label>GLM API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  You can skip this step and configure the API key later in
                  settings. Get your key from{" "}
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

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">What you can do with AI:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Transcribe audio to meeting minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Extract text from images and PDFs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Polish, expand, and translate content
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Chat with AI for assistance
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={handleComplete}>
                {apiKey ? "Save and Start" : "Skip for Now"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};