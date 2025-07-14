import SparksIcon from "../../../assets/icons/sparks.svg";
import type { IAssistant, ILabels } from "@workspaceui/api-client/src/api/copilot";
import RadioGrid, { type RadioGridOption } from "../../RadioGrid";

interface AssistantSelectorProps {
  assistants: IAssistant[];
  selectedAssistant: IAssistant | null;
  onSelectAssistant: (assistant: IAssistant) => void;
  labels: ILabels;
}

const AssistantSelector: React.FC<AssistantSelectorProps> = ({ assistants, selectedAssistant, onSelectAssistant }) => {
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
      case "bastian":
        return "😊";
      case "purchase":
        return "🛒";
      case "sql":
        return "📊";
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
      <div className="text-center mb-6">
        <h5 className="text-xl font-medium mb-2">
          ¡Hola! ✨🚀 Selecciona el perfil que más se ajuste a tu tarea y comencemos. 💪
        </h5>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <SparksIcon />
          <h6 className="text-lg font-semibold">Perfiles</h6>
        </div>
        <button type="button" className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer">
          Conoce más sobre Copilot →
        </button>
      </div>

      <RadioGrid
        options={radioOptions}
        selectedValue={selectedAssistant?.app_id || null}
        onSelect={handleSelect}
        columns={3}
        name="assistant-selector"
      />
    </div>
  );
};

export default AssistantSelector;
