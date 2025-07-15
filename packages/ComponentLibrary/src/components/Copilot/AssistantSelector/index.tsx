import SparksIcon from "../../../assets/icons/sparks.svg";
import type { IAssistant, ILabels } from "@workspaceui/api-client/src/api/copilot";
import RadioGrid, { type RadioGridOption } from "../../RadioGrid";
import { IconButton } from "../..";

interface AssistantSelectorProps {
  assistants: IAssistant[];
  selectedAssistant: IAssistant | null;
  onSelectAssistant: (assistant: IAssistant) => void;
  labels: ILabels;
  isExpanded?: boolean;
}

const AssistantSelector: React.FC<AssistantSelectorProps> = ({
  assistants,
  selectedAssistant,
  onSelectAssistant,
  isExpanded = false,
}) => {
  if (!assistants || !Array.isArray(assistants) || assistants.length === 0) {
    console.error("AssistantSelector: Invalid assistants data:", assistants);
    return (
      <div className="p-6 text-center">
        <h6 className="text-lg font-medium text-gray-600">
          {!assistants || !Array.isArray(assistants)
            ? "Error: Datos de asistentes inválidos"
            : "No hay asistentes disponibles"}
        </h6>
      </div>
    );
  }

  const getAssistantIcon = (assistantId: string) => {
    switch (assistantId) {
      case "D250A40AB629492AA2F751374D6B9359":
        return "😊";
      case "purchase":
        return "📊";
      case "DB8362448FE54881B86331D9BF1D806A":
        return "🛒";
      default:
        return "🤖";
    }
  };

  const radioOptions: RadioGridOption[] = assistants.map((assistant) => ({
    value: assistant.app_id,
    label: assistant.name,
    description: assistant.description || "Asistente de Etendo Copilot",
    icon: <span className="text-2xl">{getAssistantIcon(assistant.app_id)}</span>,
  }));

  const handleSelect = (value: string) => {
    const assistant = assistants.find((a) => a.app_id === value);
    if (assistant) {
      onSelectAssistant(assistant);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 bg-white rounded-b-xl rounded-tr-xl p-2 border-1 border-(--color-transparent-neutral-10) shadow-xl">
        <h5 className="text-sm font-medium mb-2">
          ¡Hola! ✨🚀 Selecciona el perfil que más se ajuste a tu tarea y comencemos. 💪
        </h5>
      </div>

      <div className="bg-(--color-baseline-10) rounded-xl border-1 border-(--color-transparent-neutral-10) shadow-xl">
        <div className="flex justify-between items-center bg-white p-3 pr-4 rounded-t-xl">
          <div className="flex items-center gap-2">
            <IconButton className="">
              <SparksIcon />
            </IconButton>
            <h6 className="text-lg font-semibold">Perfiles</h6>
          </div>
          <button type="button" className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer">
            Conoce más sobre Copilot →
          </button>
        </div>

        <div className="p-2 overflow-y-auto max-h-90">
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
