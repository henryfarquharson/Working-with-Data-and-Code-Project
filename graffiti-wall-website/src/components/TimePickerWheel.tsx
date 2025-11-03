import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface TimePickerWheelProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}

const TimePickerWheel = ({ value, onChange, label }: TimePickerWheelProps) => {
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());

  useEffect(() => {
    const newDate = new Date(year, month, day, hour, minute);
    onChange(newDate);
  }, [year, month, day, hour, minute]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-5 gap-3">
        <div>
          <Label className="text-xs">Year</Label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Month</Label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Day</Label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            {days.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Hour</Label>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            {hours.map((h) => (
              <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Min</Label>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            {minutes.map((m) => (
              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};

export default TimePickerWheel;
