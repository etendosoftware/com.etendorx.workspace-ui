import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { theme } from '../../theme';
import SecondaryTabs from '../SecondaryTabs';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';

const SearchModal = ({ tabsConfig, variant = 'default', searchData }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleChangeTab = (newValue) => {
    setActiveTab(newValue);
  };

  const renderSectionContentDefault = (section) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Box sx={{ margin: 0, display: 'flex', flexDirection: "column", }}>
          <Box sx={{ borderRadius: '12px', gap: '12px', backgroundColor: theme.palette.baselineColor.neutral[0], padding: '12px 16px', border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Typography sx={{ color: theme.palette.baselineColor.neutral[90], fontSize: '14px', lineHeight: '20px', fontWeight: 500 }}>
                {section.title} ({section.items.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', }}>
              {section.items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: '8px', paddingY: '8px', paddingX: '4px', }}>
                  <Box sx={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontWeight: 500,
                  }}>
                    {item.icon}
                  </Box>
                  <Typography sx={{
                    color: theme.palette.baselineColor.neutral[90],
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontWeight: 500,
                    opacity: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSectionContentTabs = (section, isLast) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Box sx={{ borderBottom: isLast ? 'none' : `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}` }}>
          <Box sx={{ padding: '12px', paddingBottom: isLast ? '8px' : '8px', margin: 0, display: 'flex', flexDirection: "column", gap: '12px', }}>
            <Box sx={{ borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Typography sx={{ color: theme.palette.baselineColor.etendoPrimary.main, fontSize: '14px', lineHeight: '20px', fontWeight: 500 }}>
                  {section.title} ({section.items.length})
                </Typography>
                <ArrowForwardIcon sx={{ rotate: '320deg', color: theme.palette.baselineColor.etendoPrimary.main, fontSize: '16px' }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', }}>
                {section.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: '8px', paddingY: '8px', paddingX: '4px' }}>
                    <Box sx={{
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontWeight: 500,
                    }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{
                      color: theme.palette.baselineColor.neutral[90],
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontWeight: 500,
                      opacity: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </Typography>
                    {item.isNew && (
                      <Box sx={{
                        backgroundColor: theme.palette.baselineColor.etendoPrimary.main,
                        color: theme.palette.baselineColor.neutral[0],
                        borderRadius: '200px',
                        padding: '0px 8px',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}>
                        {item.newLabel}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderTabContent = () => {
    const activeTabConfig = tabsConfig[activeTab];
    if (activeTab === 0) { // "Todo" tab
      return (
        <>
          {tabsConfig.slice(1).map((tab, index, array) => (
            <React.Fragment key={index}>
              {renderSectionContentTabs({ title: tab.label, items: tab.items }, index === array.length - 1)}
            </React.Fragment>
          ))}
        </>
      );
    } else {
      return renderSectionContentTabs({ title: activeTabConfig.label, items: activeTabConfig.items }, true);
    }
  };

  const renderContent = () => {
    if (variant === 'default') {
      return (
        <>
          <Box sx={{ display: 'flex', padding: '12px 20px 12px 12px', alignItems: 'center', backgroundColor: theme.palette.baselineColor.neutral[0] }}>
            <Box sx={{
              position: 'relative',
              backgroundColor: theme.palette.baselineColor.etendoPrimary.contrastText,
              borderRadius: "200px",
              width: '32px',
              height: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <SearchIcon sx={{ color: theme.palette.dynamicColor.main, height: 20, width: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontSize: '16px', color: theme.palette.baselineColor.neutral[90], ml: 1, fontWeight: 600 }}>Búsquedas recientes</Typography>
          </Box>

          <Box sx={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchData.map((section, index) => (
              <React.Fragment key={index}>
                {renderSectionContentDefault(section)}
              </React.Fragment>
            ))}
          </Box>
        </>
      );
    } else {
      return (
        <>
          <SecondaryTabs tabsConfig={tabsConfig} selectedTab={activeTab} onChange={handleChangeTab} />
          {renderTabContent()}
        </>
      );
    }
  };

  return (
    <Box
      sx={{
        width: '410px',
        padding: variant === 'default' ? 0 : '4px 0',
        height: 'auto',
        '&:focus-visible': { outline: 'none' },
        border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
        boxShadow: `0px 4px 10px 0px ${theme.palette.baselineColor.transparentNeutral[10]}`,
        borderRadius: '12px',
        backgroundColor: theme.palette.baselineColor.neutral[0],
      }}
    >
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: 'calc(100vh - 50px)',
          borderRadius: '12px',
          backgroundColor: variant === 'default' ? theme.palette.baselineColor.neutral[10] : theme.palette.baselineColor.neutral[0],
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default SearchModal;
