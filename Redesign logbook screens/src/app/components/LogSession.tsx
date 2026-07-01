import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";

export function LogSession() {
  const navigate = useNavigate();
  const [hours, setHours] = useState(1);
  const [date, setDate] = useState("Tue, Jun 30, 2026");
  const [sessionType, setSessionType] = useState("training");
  const [format, setFormat] = useState("single");
  const [progress, setProgress] = useState("neutral");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    // Save logic here
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg">Log Training Session</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Hours and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-neutral-600 mb-2 block">Hours Trained</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHours(Math.max(0.5, hours - 0.5))}
                className="size-10 flex items-center justify-center border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <Minus className="size-4" />
              </button>
              <div className="flex-1 text-center text-xl">{hours}h</div>
              <button
                onClick={() => setHours(hours + 0.5)}
                className="size-10 flex items-center justify-center border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm text-neutral-600 mb-2 block">Date</Label>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-2.5">
              <Calendar className="size-4 text-neutral-400" />
              <span className="text-sm">Jun 30</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Session Type */}
        <div>
          <Label className="text-sm text-neutral-600 mb-3 block">Session Type</Label>
          <RadioGroup value={sessionType} onValueChange={setSessionType}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="training" id="training" />
              <Label htmlFor="training" className="font-normal cursor-pointer">Training</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="social" id="social" />
              <Label htmlFor="social" className="font-normal cursor-pointer">Social</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="class" id="class" />
              <Label htmlFor="class" className="font-normal cursor-pointer">Class</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Format */}
        <div>
          <Label className="text-sm text-neutral-600 mb-3 block">Format</Label>
          <RadioGroup value={format} onValueChange={setFormat}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="font-normal cursor-pointer">Single</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="double" id="double" />
              <Label htmlFor="double" className="font-normal cursor-pointer">Double</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Progress */}
        <div>
          <Label className="text-sm text-neutral-600 mb-3 block">How did you feel about your progress?</Label>
          <RadioGroup value={progress} onValueChange={setProgress}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="struggling" id="struggling" />
              <Label htmlFor="struggling" className="font-normal cursor-pointer">Struggling</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="difficult" id="difficult" />
              <Label htmlFor="difficult" className="font-normal cursor-pointer">Difficult</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="neutral" id="neutral" />
              <Label htmlFor="neutral" className="font-normal cursor-pointer">Neutral</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="good" id="good" />
              <Label htmlFor="good" className="font-normal cursor-pointer">Good</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excellent" id="excellent" />
              <Label htmlFor="excellent" className="font-normal cursor-pointer">Excellent</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="text-sm text-neutral-600 mb-2 block">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you work on? Any insights or goals for next time?"
            className="min-h-24 resize-none"
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-6 max-w-md mx-auto">
        <Button onClick={handleSave} className="w-full bg-black text-white hover:bg-neutral-800">
          Save Training Session
        </Button>
      </div>
    </div>
  );
}
