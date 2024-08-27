import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import FormView from '../FormView';
import Spinner from '../Spinner';
import { theme } from '../../theme';
import PencilIcon from '../../assets/icons/edit-2.svg';
import SaveIcon from '../../assets/icons/save.svg';
import { styles, sx } from './styles';
import { useRecordContext } from '../../../../MainUI/src/hooks/useRecordContext.ts';
import { TabWidgetProps } from './types.ts';

const TabWidget: React.FC<TabWidgetProps> = ({
  onSave,
  onCancel,
  editButtonLabel = '',
  cancelButtonLabel = '',
  saveButtonLabel = '',
}) => {
  const { selectedRecord, setSelectedRecord } = useRecordContext();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedRecord) {
      setSelectedRecord(selectedRecord);
      setIsEditing(false);
    }
  }, [selectedRecord, setSelectedRecord]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    if (selectedRecord) {
      onSave(selectedRecord);
      setSelectedRecord(selectedRecord);
    }
    setIsEditing(false);
  }, [onSave, selectedRecord, setSelectedRecord]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setSelectedRecord(selectedRecord);
    onCancel();
  }, [onCancel, selectedRecord, setSelectedRecord]);

  const handleFormChange = useCallback(() => {}, []);

  const memoizedFormView = useMemo(() => {
    if (!selectedRecord) return null;

    return (
      <FormView
        key={selectedRecord.id.value}
        data={selectedRecord}
        onSave={handleSave}
        onCancel={handleCancel}
        readOnly={!isEditing}
        gridItemProps={{ xs: 12, sm: 1, md: 12 }}
        dottedLineInterval={12}
        onChange={handleFormChange}
      />
    );
  }, [selectedRecord, handleSave, handleCancel, isEditing, handleFormChange]);

  if (!selectedRecord) {
    return <Spinner />;
  }

  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%">
      <Box flexGrow={1} overflow="auto">
        {memoizedFormView}
      </Box>
      <Box mt={2}>
        {!isEditing ? (
          <Button
            startIcon={
              <PencilIcon fill={theme.palette.baselineColor.neutral[0]} />
            }
            sx={sx.editButtonStyles}
            onClick={handleEdit}>
            {editButtonLabel}
          </Button>
        ) : (
          <Box style={styles.buttonContainerStyles}>
            <Button sx={sx.cancelbuttonStyles} onClick={handleCancel}>
              {cancelButtonLabel}
            </Button>
            <Button
              startIcon={
                <SaveIcon fill={theme.palette.baselineColor.neutral[0]} />
              }
              sx={sx.saveButtonStyles}
              onClick={handleSave}>
              {saveButtonLabel}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TabWidget;
