'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { use, useContext } from 'react';
import { ModelContext } from '@/lib/ModelProvider';

export default function ModelSelector() {
  const { currentModel, setCurrentModel } = use(ModelContext);

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="model-select" className="text-sm font-medium">
      </label>
      <Select
        value={currentModel}
        onValueChange={(value) => setCurrentModel(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini-1.5-flash">Gemini</SelectItem>
          <SelectItem value="LLaMA-8x7B-32768">LLaMA-8x7B-32768 </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}