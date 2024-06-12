import { Grid, Link, Menu } from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  BORDER_SELECT_1,
  BORDER_SELECT_2,
  COLUMN_SPACING,
  DYNAMIC_COLOR_MAIN,
  FIRST_MARGIN_TOP,
  NEUTRAL_30,
  menuSyle,
  styles,
} from './style';
import IconButton from '../IconButton';
import { IConfigurationModalProps, ISection } from './types';
import { ALT } from './constants';
import checkIcon from '../../assets/icons/check-circle-filled.svg';
import './stlye.css';

const ConfigurationModal: React.FC<IConfigurationModalProps> = ({
  icon,
  title,
  linkTitle,
  sections = [],
  open,
  onChangeSelect,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sectionsState, setSectionsState] = useState<ISection[]>(sections);

  useEffect(() => {
    setSectionsState(sections);
  }, [sections]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpen = (): boolean => {
    if (open !== undefined) {
      return open;
    }
    return Boolean(anchorEl);
  };

  const handleImageClick = (sectionIndex: number, imageIndex: number) => {
    setSectionsState(prevSections => {
      const newSections = [...prevSections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        selectedItem: imageIndex,
      };
      return newSections;
    });

    if (onChangeSelect) {
      const selectedItem = sectionsState[sectionIndex].items[imageIndex];
      onChangeSelect(selectedItem.id, sectionIndex, imageIndex);
    }
  };

  const addBorder = (selectedImageIndex: number, imageIndex: number) => {
    return isSelected(selectedImageIndex, imageIndex)
      ? BORDER_SELECT_2 + DYNAMIC_COLOR_MAIN
      : BORDER_SELECT_1 + NEUTRAL_30;
  };

  const isSelected = (
    selectedImageIndex: number,
    imageIndex: number,
  ): boolean => {
    return selectedImageIndex === imageIndex;
  };

  const removeFirstMargin = (index: number): number | string => {
    return index === 0 ? 0 : FIRST_MARGIN_TOP;
  };

  return (
    <>
      <IconButton onClick={handleClick} icon={icon} />
      <Menu
        {...props}
        anchorEl={anchorEl}
        open={handleOpen()}
        onClose={handleClose}
        slotProps={{
          paper: { sx: styles.paperStyleMenu },
        }}
        MenuListProps={{ sx: menuSyle }}>
        <div style={styles.titleModalContainer}>
          <div style={styles.titleModalImageContainer}>
            {title?.icon && (
              <div style={styles.titleModalImageRadius}>
                <img style={styles.titleModalImage} src={title?.icon} />
              </div>
            )}
            <div style={styles.titleModal}>{title?.label}</div>
          </div>
          <Link style={styles.titleButton} href={linkTitle?.url}>
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
                {section.items.map(({ img, id, label }, imageIndex) => (
                  <Grid item key={id}>
                    <div style={styles.imgWrapper}>
                      <div
                        onClick={() =>
                          handleImageClick(sectionIndex, imageIndex)
                        }
                        style={{
                          border: addBorder(section.selectedItem, imageIndex),
                          ...styles.imgContainer,
                        }}>
                        <img
                          src={img}
                          alt={`${ALT}-${imageIndex}`}
                          style={styles.img}
                        />
                      </div>
                    </div>
                    <div style={styles.labelIconContainer}>
                      {isSelected(section.selectedItem, imageIndex) && (
                        <img
                          className="fade-in-left"
                          style={styles.labelIcon}
                          src={checkIcon}></img>
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
