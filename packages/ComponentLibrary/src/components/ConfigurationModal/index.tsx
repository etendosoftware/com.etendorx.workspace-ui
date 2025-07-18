import { Link } from "@mui/material";
import React, { useEffect, useState } from "react";
import RadioButtonIcon from "../../assets/icons/radio-button.svg";
import CircleIcon from "../../assets/icons/circle.svg";
import type { IConfigurationModalProps, ISection } from "./types";
import "./style.css";
import IconButton from "../IconButton";
import Menu from "../Menu";

const IconRenderer = ({ icon, imageStyles }: { icon: string | React.ReactNode; imageStyles?: string }): JSX.Element => {
  if (typeof icon === "string") {
    return <img src={icon} alt="icon" className={imageStyles} />;
  }
  if (React.isValidElement(icon)) {
    return icon;
  }
  return <span>Invalid icon</span>;
};

const ConfigurationModal: React.FC<IConfigurationModalProps> = ({
  icon,
  tooltipButtonProfile = "",
  title,
  linkTitle,
  sections = [],
  onChangeSelect,
  ...props
}) => {
  const [sectionsState, setSectionsState] = useState<ISection[]>(sections);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const availableSections = sections.filter((section) => !section.isDisabled);
    setSectionsState(availableSections);
  }, [sections]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleImageClick = (sectionIndex: number, imageIndex: number) => {
    setSectionsState((prevSections) => {
      const newSections = [...prevSections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        selectedItem: imageIndex,
      };
      return newSections;
    });

    if (onChangeSelect) {
      const currentSection = sectionsState[sectionIndex];
      if (!currentSection || !currentSection.items[imageIndex]) return;
      const selectedItem = currentSection.items[imageIndex];
      onChangeSelect({ id: selectedItem.id, sectionId: currentSection.id, sectionIndex, imageIndex });
      handleClose();
    }
  };

  const isSelected = (selectedImageIndex: number, imageIndex: number): boolean => {
    return selectedImageIndex === imageIndex;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        tooltip={tooltipButtonProfile}
        aria-label={tooltipButtonProfile}
        className="w-10 h-10">
        {icon}
      </IconButton>
      <Menu {...props} anchorEl={anchorEl} onClose={handleClose}>
        <div className="h-14 p-3 flex flex-row items-center justify-between bg-[var(--color-baseline-0)] border-b border-[var(--color-baseline-10)]">
          <div className="flex flex-row items-center gap-4">
            {title?.icon && (
              <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-dynamic-contrast-text)] rounded-full">
                <IconRenderer icon={title.icon} />
              </div>
            )}
            <div className="text-base font-semibold text-[var(--color-baseline-90)]">{title?.label}</div>
          </div>
          <Link sx={{ visibility: "hidden" }} href={linkTitle?.url}>
            {linkTitle?.label}
          </Link>
        </div>
        <div className="p-3 gap-3 bg-[var(--color-baseline-10)]">
          {sectionsState.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="py-3 px-4 flex flex-col gap-3 bg-[var(--color-baseline-0)] border border-[var(--color-transparent-neutral-10)] rounded-xl">
              <div className="text-sm font-medium text-[var(--color-baseline-90)]">{section.name}</div>
              <div className="w-full h-full flex flex-row gap-3">
                {section.items.map(({ id, label, img }, imageIndex) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleImageClick(sectionIndex, imageIndex)}
                    className={`relative p-3 pt-12 flex flex-col gap-2 bg-[var(--color-baseline-0)] box-border border-2 ${isSelected(section.selectedItem, imageIndex) ? "border-[var(--color-etendo-main)]" : "border-[var(--color-transparent-neutral-10)]"} rounded-xl overflow-hidden hover:border-[var(--color-baseline-90)] transition-colors duration-250 ease-in-out`}>
                    <div className="absolute top-0 left-0 h-12 w-12 flex items-center justify-center">
                      {isSelected(section.selectedItem, imageIndex) ? (
                        <RadioButtonIcon width="1.5rem" height="1.5rem" fill="var(--color-dynamic-main)" />
                      ) : (
                        <CircleIcon width="1.5rem" height="1.5rem" fill="var(--color-baseline-70)" />
                      )}
                    </div>
                    <IconRenderer icon={img} imageStyles="rounded-xl border border-[var(--color-baseline-30)]" />
                    <span className="text-sm font-medium text-[var(--color-baseline-100)] text-left">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Menu>
    </>
  );
};

export default ConfigurationModal;
