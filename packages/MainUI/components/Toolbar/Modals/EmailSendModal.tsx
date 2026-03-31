import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Modal from "../../Modal";
import Button from "../../../../ComponentLibrary/src/components/Button/Button";
import CloseIcon from "../../../../ComponentLibrary/src/assets/icons/x.svg";
import ChevronDown from "../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import { useTranslation } from "@/hooks/useTranslation";

export interface EmailFormData {
  to: string;
  cc: string;
  bcc: string;
  replyTo: string;
  subject: string;
  body: string;
  archive: boolean;
  templateId: string;
}

interface Template {
  id: string;
  name: string;
}

interface EmailSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: EmailFormData) => Promise<void>;
  loading: boolean;
  initialData?: {
    to?: string;
    toName?: string;
    cc?: string;
    bcc?: string;
    bccName?: string;
    replyTo?: string;
    subject?: string;
    body?: string;
    archive?: boolean;
    reportFileName?: string;
    templates?: Template[];
    selectedTemplateId?: string;
  };
}

const BODY_REFERENCES = [
  { token: "@cus_ref@", desc: "The document reference of the customer" },
  { token: "@our_ref@", desc: "The reference of the document" },
  { token: "@cus_nam@", desc: "The name of the customer" },
  { token: "@sal_nam@", desc: "The name of the sales rep." },
  { token: "@bp_nam@", desc: "The Business Partner name" },
  { token: "@doc_date@", desc: "The document date" },
  { token: "@doc_desc@", desc: "The document description" },
  { token: "@doc_nextduedate@", desc: "The next due date (if any)" },
  { token: "@doc_lastduedate@", desc: "The last due date (if any)" },
];

const EmailSendModal: React.FC<EmailSendModalProps> = ({ isOpen, onClose, onSend, loading, initialData }) => {
  const { t } = useTranslation();
  const [showMoreFields, setShowMoreFields] = useState(false);

  const templates = initialData?.templates ?? [];
  const reportFileName = initialData?.reportFileName ?? "";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    defaultValues: {
      to: initialData?.to ?? "",
      cc: initialData?.cc ?? "",
      bcc: initialData?.bcc ?? "",
      replyTo: initialData?.replyTo ?? "",
      subject: initialData?.subject ?? "",
      body: initialData?.body ?? "",
      archive: initialData?.archive ?? false,
      templateId: initialData?.selectedTemplateId ?? templates[0]?.id ?? "",
    },
  });

  const onSubmit = (data: EmailFormData) => {
    onSend(data);
  };

  return (
    <Modal open={isOpen} onClose={onClose} data-testid="Modal__387282">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold">{t("email.title")}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-(--color-baseline-10)"
              aria-label="Close">
              <CloseIcon className="w-4 h-4" data-testid="CloseIcon__387282" />
            </button>
          </div>

          {/* Form body */}
          <form
            id="email-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {/* To */}
            <div className="h-12 flex items-center">
              <div className="w-[15%] flex items-center gap-2 pr-2">
                <label
                  htmlFor="to"
                  className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.to")}
                </label>
                <span className="text-[#DC143C] font-bold min-w-[12px]" aria-required>
                  *
                </span>
              </div>
              <div className="w-[85%] flex items-center gap-2">
                <Controller
                  name="to"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="to"
                      type="text"
                      placeholder="email@example.com"
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main) ${
                        errors.to ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  )}
                  data-testid="Controller__387282"
                />
                {initialData?.toName && <span className="text-gray-600 text-sm shrink-0">{initialData.toName}</span>}
              </div>
            </div>

            {/* BCC */}
            <div className="h-12 flex items-center">
              <div className="w-[15%] flex items-center gap-2 pr-2">
                <label
                  htmlFor="bcc"
                  className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.bcc")}
                </label>
              </div>
              <div className="w-[85%] flex items-center gap-2">
                <Controller
                  name="bcc"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="bcc"
                      type="text"
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main)"
                    />
                  )}
                  data-testid="Controller__387282"
                />
                {initialData?.bccName && <span className="text-gray-600 text-sm shrink-0">{initialData.bccName}</span>}
              </div>
            </div>

            {/* Reply-to */}
            <div className="h-12 flex items-center">
              <div className="w-[15%] flex items-center gap-2 pr-2">
                <label
                  htmlFor="replyTo"
                  className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.replyTo")}
                </label>
              </div>
              <div className="w-[85%]">
                <Controller
                  name="replyTo"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="replyTo"
                      type="text"
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main)"
                    />
                  )}
                  data-testid="Controller__387282"
                />
              </div>
            </div>

            {/* Show More Fields toggle */}
            <div className="h-8 flex items-center">
              <div className="w-[15%] pr-2" />
              <div className="w-[85%]">
                <button
                  type="button"
                  onClick={() => setShowMoreFields((p) => !p)}
                  className="text-blue-700 underline text-sm hover:text-blue-900">
                  [ {showMoreFields ? t("email.hideFields") : t("email.showMoreFields")} ]
                </button>
              </div>
            </div>

            {/* CC (more fields) */}
            {showMoreFields && (
              <div className="h-12 flex items-center">
                <div className="w-[15%] flex items-center gap-2 pr-2">
                  <label
                    htmlFor="cc"
                    className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                    {t("email.cc")}
                  </label>
                </div>
                <div className="w-[85%]">
                  <Controller
                    name="cc"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="cc"
                        type="text"
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main)"
                      />
                    )}
                    data-testid="Controller__387282"
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="h-12 flex items-center">
              <div className="w-[15%] flex items-center gap-2 pr-2">
                <label
                  htmlFor="subject"
                  className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.subject")}
                </label>
                <span className="text-[#DC143C] font-bold min-w-[12px]" aria-required>
                  *
                </span>
              </div>
              <div className="w-[85%]">
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="subject"
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main) ${
                        errors.subject ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  )}
                  data-testid="Controller__387282"
                />
              </div>
            </div>

            {/* Message Body + reference panel */}
            <div className="flex items-start">
              <div className="w-[15%] flex items-start gap-2 pr-2 pt-2">
                <label
                  htmlFor="body"
                  className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.body")}
                </label>
              </div>
              <div className="w-[85%] flex gap-3">
                <Controller
                  name="body"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id="body"
                      rows={8}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main) resize-none"
                    />
                  )}
                  data-testid="Controller__387282"
                />
                {/* Reference panel */}
                <div className="w-48 shrink-0 text-xs text-gray-600 pt-1 leading-relaxed space-y-1">
                  <p className="font-semibold mb-1">References:</p>
                  {BODY_REFERENCES.map(({ token, desc }) => (
                    <p key={token}>
                      <span className="font-semibold">{token}</span>: {desc}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Template to use */}
            <div className="h-12 flex items-center">
              <div className="w-[15%] flex items-center gap-2 pr-2">
                <label
                  htmlFor="templateId"
                  className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.template")}
                </label>
              </div>
              <div className="w-[85%]">
                <Controller
                  name="templateId"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <select
                        {...field}
                        id="templateId"
                        disabled={templates.length === 0}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-(--color-etendo-main) disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-10 bg-white">
                        {templates.length === 0 ? (
                          <option value="">{t("email.noTemplatesAvailable")}</option>
                        ) : (
                          <>
                            <option value="">{t("email.selectTemplate")}</option>
                            {templates.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {!loading && templates.length > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-500" data-testid={"ChevronDown__" + field.id} />
                        </div>
                      )}
                    </div>
                  )}
                  data-testid="Controller__387282"
                />
              </div>
            </div>

            {/* Attached Documents */}
            <div className="flex items-start">
              <div className="w-[15%] flex items-start gap-2 pr-2 pt-2">
                <label className="overflow-hidden text-ellipsis whitespace-nowrap block text-sm font-medium select-none truncate pr-[2px] text-gray-700">
                  {t("email.attachDocument")}
                </label>
              </div>
              <div className="w-[85%] space-y-2">
                {/* Table */}
                <table className="w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-1 border-b border-gray-300 font-semibold">File name</th>
                      <th className="text-center px-3 py-1 border-b border-gray-300 font-semibold w-20">Archive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportFileName ? (
                      <tr>
                        <td className="px-3 py-1 border-b border-gray-200">{reportFileName}</td>
                        <td className="text-center px-3 py-1 border-b border-gray-200">
                          <Controller
                            name="archive"
                            control={control}
                            render={({ field: { value, onChange, ...rest } }) => (
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => onChange(e.target.checked)}
                                {...rest}
                                className="h-4 w-4 cursor-pointer"
                              />
                            )}
                            data-testid="Controller__387282"
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-gray-400 text-center">
                          —
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Choose File */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-500 cursor-not-allowed">
                    Choose File
                  </button>
                  <span className="text-gray-400 text-sm">No file chosen</span>
                </div>
              </div>
            </div>

            {/* Add Attachment button */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-[15%] pr-2" />
              <div className="w-[85%]">
                <Button variant="outlined" type="button" disabled title="Coming soon" data-testid="Button__387282">
                  {t("email.addAttachment")}
                </Button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex gap-3 justify-end mx-3 my-3">
            <Button
              variant="outlined"
              size="large"
              className="w-49"
              onClick={onClose}
              disabled={loading}
              data-testid="Button__387282">
              {t("common.cancel")}
            </Button>
            <Button
              variant="filled"
              size="large"
              className="w-49"
              type="submit"
              form="email-form"
              disabled={loading}
              data-testid="Button__387282">
              {loading ? t("email.sending") : t("email.send")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmailSendModal;
