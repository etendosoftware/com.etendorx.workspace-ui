import SparksIcon from "../../../assets/icons/sparks.svg";
import RadioGrid, { type RadioGridOption } from "../../RadioGrid";
import { IconButton, TextInputBase } from "../..";
import type { AssistantSelectorProps } from "../types";
import { useState } from "react";

const AssistantSelector: React.FC<AssistantSelectorProps> = ({
  assistants,
  selectedAssistant,
  onSelectAssistant,
  isExpanded = false,
  showDescription,
  translations,
}) => {
  const [filterText, setFilterText] = useState("");

  if (!assistants || !Array.isArray(assistants) || assistants.length === 0) {
    console.error("AssistantSelector: Invalid assistants data:", assistants);
    return (
      <div className="p-6 text-center">
        <h6 className="text-lg font-medium text-gray-600">
          {!assistants || !Array.isArray(assistants)
            ? translations.errorInvalidData
            : translations.errorNoAssistantsAvailable}
        </h6>
      </div>
    );
  }

  const filteredAssistants = assistants.filter(
    (assistant) =>
      assistant.name.toLowerCase().includes(filterText.toLowerCase()) ||
      assistant.description?.toLowerCase().includes(filterText.toLowerCase())
  );

  const radioOptions: RadioGridOption[] = filteredAssistants.map((assistant) => ({
    value: assistant.app_id,
    label: assistant.name,
    description: showDescription ? assistant.description || translations.defaultDescription : undefined,
  }));

  const handleSelect = (value: string) => {
    const assistant = filteredAssistants.find((a) => a.app_id === value);
    if (assistant) {
      onSelectAssistant(assistant);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 bg-white rounded-b-xl rounded-tr-xl p-2 border-1 border-(--color-transparent-neutral-10) shadow-xl">
        <h5 className="text-sm font-medium mb-2">{translations.welcomeMessage}</h5>
      </div>

      <div className="bg-(--color-baseline-10) rounded-xl border-1 border-(--color-transparent-neutral-10) shadow-xl">
        <div className="flex justify-between items-center bg-white p-3 pr-4 rounded-t-xl">
          <div className="flex items-center gap-2">
            <IconButton className="">
              <SparksIcon />
            </IconButton>
            <h6 className="text-lg font-semibold">{translations.profilesTitle}</h6>
          </div>
          <div className="w-48">
            <TextInputBase
              value={filterText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
              placeholder={translations.filterPlaceholder}
              size="small"
            />
          </div>
        </div>

        <div className={`p-2 overflow-y-auto ${isExpanded ? "max-h-[calc(100vh-20rem)]" : "max-h-90"}`}>
          <RadioGrid
            options={radioOptions}
            selectedValue={selectedAssistant?.app_id || null}
            onSelect={handleSelect}
            columns={isExpanded ? 3 : 1}
            name="assistant-selector"
          />
        </div>
      </div>
    </div>
  );
};

export default AssistantSelector;
