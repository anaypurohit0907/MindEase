import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        setModels(data.models.map((m: OllamaModel) => m.name));
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <Select value={currentModel} onValueChange={onModelChange} disabled={loading}>
      <SelectTrigger className="h-8 w-[180px] text-xs bg-zinc-800/50 border-zinc-700">
        <SelectValue placeholder={loading ? "Loading..." : "Select model"} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
        {loading ? (
          <SelectItem value="loading">Loading models...</SelectItem>
        ) : (
          models.map(model => (
            <SelectItem 
              key={model} 
              value={model}
              className="text-xs focus:bg-zinc-700 focus:text-zinc-100"
            >
              {model}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
