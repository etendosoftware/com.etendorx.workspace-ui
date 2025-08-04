/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { theme } from '../../../../ComponentLibrary/src/theme';
import type { CSSProperties } from 'react';

export const cardStyles: CSSProperties = {
  margin: '0.25rem',
  padding: '0.5rem',
  width: '10.75rem',
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
};

export const boxStyles: CSSProperties = {
  height: '5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
};

export const typographyStyles = {
  caption: {
    fontWeight: 600,
    fontSize: '0.75rem',
  },
};

export const typographyTitleStyles = {
  margin: 16,
  marginBottom: 0,
  color: theme.palette.baselineColor.neutral[90],
  fontWeight: 500,
  fontSize: '1.5rem',
};
