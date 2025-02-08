import { useState } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    placeholder: 'Enter your Gemini API key'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'Enter your OpenAI API key'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    placeholder: 'Enter your Anthropic API key'
  }
];

interface ApiKeyDialogProps {
  onSave: (provider: string, apiKey: string) => void;
}

export function ApiKeyDialog({ onSave }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState(PROVIDERS[0].id);

  const handleSave = () => {
    onSave(provider, apiKey);
    setApiKey('');
  };

  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  return (
    <DialogContent className="bg-zinc-900 border-zinc-800">
      <DialogHeader>
        <DialogTitle className="text-zinc-100">Add API Model</DialogTitle>
        <DialogDescription className="text-zinc-400">
          Enter your API key to use models from different providers.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {PROVIDERS.map((provider) => (
                <SelectItem 
                  key={provider.id} 
                  value={provider.id}
                  className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                >
                  <span>{provider.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={selectedProvider?.placeholder}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={handleSave}
          disabled={!apiKey}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          Save API Key
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
