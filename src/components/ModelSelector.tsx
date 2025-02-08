import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ApiKeyDialog } from './ApiKeyDialog';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
}

interface OllamaModel {
  name: string;
  // Add other properties if needed
  size?: number;
  digest?: string;
  modified_at?: string;
}

interface ModelMetadata {
  id: string;
  displayName: string;
  provider: string;
}

const API_MODEL_METADATA: Record<string, ModelMetadata> = {
  'gemini-api': {
    id: 'gemini-api',
    displayName: 'Gemini Pro',
    provider: 'Google'
  }
};

export default function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [apiModels, setApiModels] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Get local models from Ollama
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        const ollama = data.models.map((m: OllamaModel) => m.name);
        setLocalModels(ollama);
        
        // Get API models from localStorage
        const stored = JSON.parse(localStorage.getItem('apiModels') || '[]');
        setApiModels(stored);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleApiKeySave = (provider: string, apiKey: string) => {
    try {
      localStorage.setItem(`${provider}ApiKey`, apiKey);
      const newModel = `${provider}-api`;
      
      if (!apiModels.includes(newModel)) {
        const updatedApiModels = [...apiModels, newModel];
        setApiModels(updatedApiModels);
        localStorage.setItem('apiModels', JSON.stringify(updatedApiModels));
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === "add-api-model") {
      setIsDialogOpen(true);
    } else {
      onModelChange(value);
    }
  };

  const getModelDisplayName = (modelId: string) => {
    if (modelId in API_MODEL_METADATA) {
      return API_MODEL_METADATA[modelId].displayName;
    }
    return modelId;
  };

  return (
    <>
      <Select value={currentModel} onValueChange={handleValueChange} disabled={loading}>
        <SelectTrigger className="h-8 w-[180px] text-xs bg-zinc-800/50 border-zinc-700">
          <SelectValue>
            {currentModel ? getModelDisplayName(currentModel) : "Select model"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
          {loading ? (
            <SelectItem value="loading">Loading models...</SelectItem>
          ) : (
            <>
              <SelectGroup>
                <SelectLabel className="text-xs text-zinc-400 px-2 py-1">Local Models</SelectLabel>
                {localModels.map(model => (
                  <SelectItem 
                    key={model} 
                    value={model}
                    className="text-xs focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    {model}
                  </SelectItem>
                ))}
              </SelectGroup>
              
              <SelectSeparator className="bg-zinc-700/50" />
              
              <SelectGroup>
                <SelectLabel className="text-xs text-zinc-400 px-2 py-1">API Models</SelectLabel>
                {apiModels.map(model => (
                  <SelectItem 
                    key={model} 
                    value={model}
                    className="text-xs focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    {getModelDisplayName(model)}
                  </SelectItem>
                ))}
                <SelectItem
                  value="add-api-model"
                  className="text-xs text-blue-400 hover:text-blue-300 focus:bg-zinc-700 focus:text-blue-300"
                >
                  + Add API Model
                </SelectItem>
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ApiKeyDialog onSave={handleApiKeySave} />
      </Dialog>
    </>
  );
}
