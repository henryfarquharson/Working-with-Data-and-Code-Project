import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Monitor } from "lucide-react";

interface Display {
  id: string;
  name: string;
  activation_code: string;
  timezone: string;
}

interface DisplaySelectorProps {
  onSelect: (display: Display | null) => void;
}

const DisplaySelector = ({ onSelect }: DisplaySelectorProps) => {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDisplays = async () => {
      try {
        const { data, error } = await supabase
          .from("displays")
          .select("id, name, activation_code, timezone")
          .order("name");

        if (error) throw error;
        setDisplays(data || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisplays();
  }, []);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading displays...</div>;
  }

  if (displays.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No displays available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Select Display</Label>
      <RadioGroup onValueChange={(id) => {
        const display = displays.find(d => d.id === id);
        onSelect(display || null);
      }}>
        {displays.map((display) => (
          <div key={display.id} className="flex items-center space-x-2">
            <RadioGroupItem value={display.id} id={display.id} />
            <Label
              htmlFor={display.id}
              className="flex items-center gap-2 cursor-pointer flex-1"
            >
              <Monitor className="h-4 w-4" />
              {display.name}
              <span className="text-xs text-muted-foreground">({display.activation_code})</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default DisplaySelector;
