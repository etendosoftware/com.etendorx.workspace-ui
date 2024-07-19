import React from 'react';
import { MRT_Row } from 'material-react-table';
import IconButton from '../IconButton';
import ChevronDownIcon from '../../assets/icons/chevron-down.svg';
import ChevronUpIcon from '../../assets/icons/chevron-up.svg';
import ChevronRightIcon from '../../assets/icons/chevron-right.svg';
import { Organization } from './types';

interface CustomExpandButtonProps {
  row: MRT_Row<Organization>;
}

const CustomExpandButton: React.FC<CustomExpandButtonProps> = ({ row }) => {
  const isExpanded = row.getIsExpanded();
  const canExpand = row.getCanExpand();

  if (!canExpand) {
    return (
      <IconButton disabled width={16} height={16}>
        <ChevronRightIcon />
      </IconButton>
    );
  }

  return (
    <IconButton
      onClick={row.getToggleExpandedHandler()}
      tooltip={isExpanded ? 'Collapse' : 'Expand'}
      width={16}
      height={16}>
      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </IconButton>
  );
};

export default CustomExpandButton;
