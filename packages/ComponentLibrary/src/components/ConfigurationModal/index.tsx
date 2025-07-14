import { Grid, Link, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import checkIconUrl from "../../assets/icons/check-circle-filled.svg?url";
import { BORDER_SELECT_1, BORDER_SELECT_2, COLUMN_SPACING, FIRST_MARGIN_TOP, useStyle } from "./style";
import type { IConfigurationModalProps, ISection } from "./types";
import "./style.css";
import IconButton from "../IconButton";
import Menu from "../Menu";

const IconRenderer = ({ icon }: { icon: string | React.ReactNode }): JSX.Element => {
  if (typeof icon === "string") {
    return <img src={icon} alt="icon" />;
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

  const [hoveredItem, setHoveredItem] = useState<{
    sectionIndex: number;
    imageIndex: number;
  } | null>(null);
  const theme = useTheme();
  const { styles, sx } = useStyle();

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
      const selectedItem = currentSection.items[imageIndex];
      onChangeSelect({ id: selectedItem.id, sectionId: currentSection.id, sectionIndex, imageIndex });
      handleClose();
    }
  };

  const handleMouseEnter = (sectionIndex: number, imageIndex: number) => {
    setHoveredItem({ sectionIndex, imageIndex });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const addBorder = (selectedImageIndex: number, imageIndex: number, sectionIndex: number) => {
    if (isSelected(selectedImageIndex, imageIndex)) {
      return BORDER_SELECT_2 + theme.palette.dynamicColor.main;
    }
    if (isHovered(sectionIndex, imageIndex)) {
      return BORDER_SELECT_2 + theme.palette.baselineColor.neutral[90];
    }
    return BORDER_SELECT_1 + theme.palette.baselineColor.neutral[30];
  };

  const isSelected = (selectedImageIndex: number, imageIndex: number): boolean => {
    return selectedImageIndex === imageIndex;
  };

  const isHovered = (sectionIndex: number, imageIndex: number): boolean => {
    return hoveredItem !== null && hoveredItem.sectionIndex === sectionIndex && hoveredItem.imageIndex === imageIndex;
  };

  const removeFirstMargin = (index: number): number | string => {
    return index === 0 ? 0 : FIRST_MARGIN_TOP;
  };

  return (
    <>
      <IconButton onClick={handleClick} tooltip={tooltipButtonProfile} disabled={false} className="w-10 h-10">
        {icon}
      </IconButton>
      <Menu {...props} anchorEl={anchorEl} onClose={handleClose}>
        <div style={styles.titleModalContainer}>
          <div style={styles.titleModalImageContainer}>
            {title?.icon && (
              <div style={styles.titleModalImageRadius}>
                <IconRenderer icon={title.icon} />
              </div>
            )}
            <div style={styles.titleModal}>{title?.label}</div>
          </div>
          <Link sx={{ ...sx.linkStyles, visibility: "hidden" }} href={linkTitle?.url}>
            {linkTitle?.label}
          </Link>
        </div>
        <div style={styles.listContainer}>
          {sectionsState.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              style={{
                ...styles.gridSectionContainer,
                marginTop: removeFirstMargin(sectionIndex),
              }}>
              <div style={styles.title}>{section.name}</div>
              <Grid columnSpacing={COLUMN_SPACING} container>
                {section.items.map(({ id, label, img }, imageIndex) => (
                  <Grid item key={id}>
                    <button
                      type="button"
                      onClick={() => handleImageClick(sectionIndex, imageIndex)}
                      onMouseEnter={() => handleMouseEnter(sectionIndex, imageIndex)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        border: addBorder(section.selectedItem, imageIndex, sectionIndex),
                        ...styles.imgContainer,
                      }}>
                      <IconRenderer icon={img} />
                    </button>
                    <div style={styles.labelIconContainer}>
                      {isSelected(section.selectedItem, imageIndex) && (
                        <img
                          alt="Selected Item Icon"
                          className="fade-in-left"
                          style={styles.labelIcon}
                          src={checkIconUrl}
                        />
                      )}
                      <div style={styles.label}>{label}</div>
                    </div>
                  </Grid>
                ))}
              </Grid>
            </div>
          ))}
        </div>
      </Menu>
    </>
  );
};

export default ConfigurationModal;
